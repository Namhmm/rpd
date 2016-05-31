(function() {

function stopPropagation(event) {
    event.stopPropagation();
    return event;
}

var d3 = d3 || d3_tiny;

function svgNode(name) { return document.createElementNS(d3.ns.prefix.svg, name); }
function htmlNode(name) { return document.createElementNS(d3.ns.prefix.html, name); }

/* ========================= util/number ========================= */

Rpd.channelrenderer('util/number', 'svg', {
    /* show: function(target, value) { }, */
    edit: function(target, inlet, valueIn) {
        var foElm = svgNode('foreignObject');
        foElm.setAttributeNS(null, 'width', 20);
        foElm.setAttributeNS(null, 'height', 30);
        var valInput = htmlNode('input');
        valInput.type = 'number';
        //valInput.style.position = 'absolute';
        valueIn.onValue(function(val) {
            valInput.value = val;
        });
        foElm.appendChild(valInput);
        target.appendChild(foElm);
        return Kefir.fromEvents(valInput, 'change')
                    .map(function() {
                        return valInput.value;
                    });
    }
});

/* ========================= util/random ========================= */

Rpd.noderenderer('util/random', 'svg', function() {
    return {
        size: { width: 40 }
    }
});

/* ========================= util/comment ========================= */

Rpd.noderenderer('util/comment', 'svg', function() {
    var textElm;
    return {
        size: { width: 100, height: 150 },
        first: function(bodyElm) {
            textElm = d3.select(bodyElm).append('text');
        },
        always: function(bodyElm, inlets, outlets) {
            if (inlets.width) textElm.attr('width', inlets.width);
            textElm.text(inlets.text || '<empty>');
        }
    }
});

/* ========================= util/comment ========================= */

Rpd.noderenderer('util/log', 'svg', function() {
    var textElm;
    var capacity = 5;
    var savedValues = [];
    return {
        size: { width: 130, height: 30 },
        first: function(bodyElm) {
            textElm = d3.select(bodyElm).append('text');
        },
        always: function(bodyElm, inlets, outlets) {
            if (inlets.what) {
                if (savedValues.length > capacity) savedValues.shift();
                savedValues.push(inlets.what);
            }
            textElm.text((savedValues.length > 0) ? ('...' + savedValues.join(', ') + '.') : '...');
        }
    }
});

/* ========================= util/bang ========================= */

Rpd.noderenderer('util/bang', 'svg', {
    size: { width: 30, height: 25 },
    first: function(bodyElm) {
        var circle = d3.select(svgNode('circle'))
                       .attr('r', 9).attr('fill', 'black')
                       .style('cursor', 'pointer')
                       .style('pointer-events', 'all');
        d3.select(bodyElm).append(circle.node());
        var circleClicks = Kefir.fromEvents(circle.node(), 'click');
        circleClicks.onValue(function() {
            circle.classed('rpd-util-bang-fresh', true);
        });
        circleClicks.delay(500).onValue(function() {
            circle.classed('rpd-util-bang-fresh', false);
        });
        return { 'trigger':
            { valueOut: circleClicks.map(function() { return {}; }) }
        };
    }
});

/* ========================= util/metro ========================= */

Rpd.noderenderer('util/metro', 'svg', function() {
    var circle;
    return {
        size: { width: 30, height: 25 },
        first: function(bodyElm) {
            circle = d3.select(svgNode('circle'))
                       .attr('r', 9).attr('fill', 'black')
                       .style('cursor', 'pointer')
                       .style('pointer-events', 'all');
            d3.select(bodyElm).append(circle.node());
        },
        always: function(bodyElm, inlets, outlets) {
            if (outlets.out) {
                outlets.out.onValue(function() {
                    circle.classed('rpd-util-metro-fresh', true);
                }).delay(500).onValue(function() {
                    circle.classed('rpd-util-metro-fresh', false);
                });
            }
        }
    }
});

/* ========================= util/palette ========================= */

/* Rpd.noderenderer('util/palette', 'svg', function() {
    var cellSide = 12;
    return {
        size: { width: 365, height: 60 },
        first: function(bodyElm) {
            var paletteChange = Kefir.emitter();
            var lastSelected, paletteGroups = [];
            d3.select(bodyElm)
              .append('g').attr('transform', 'translate(5, 0)')
              .call(function(target) {
                PALETTES.forEach(function(palette, i) {
                    target.append('g')
                          .attr('class', 'rpd-util-palette-variant')
                          .attr('transform', 'translate(' + (i * 14) + ', ' +
                                                            (-1 * (palette.length / 2 * cellSide)) + ')')
                          .call((function(palette) { return function(paletteGroup) {
                              palette.forEach(function(color, i) {
                                  paletteGroup.append('rect').attr('rx', 4)
                                              .attr('x', 0).attr('y', i * cellSide)
                                              .attr('width', cellSide).attr('height', cellSide)
                                              .attr('fill', color);
                              });
                              Kefir.fromEvents(paletteGroup.node(), 'click').onValue(function() {
                                  if (lastSelected) lastSelected.attr('class', 'rpd-util-palette-variant')
                                  paletteGroup.attr('class', 'rpd-util-palette-variant rpd-util-palette-active-variant');
                                  lastSelected = paletteGroup;
                                  paletteChange.emit(palette);
                              });
                              paletteGroups.push(paletteGroup);
                          } })(palette));
                });
            });
            lastSelected = paletteGroups[0];
            paletteGroups[0].attr('class', 'rpd-util-palette-variant rpd-util-palette-active-variant');
            return { 'selection': { valueOut: paletteChange } };
        }
    };
}); */

/* ========================= util/sum-of-three ========================= */

Rpd.noderenderer('util/sum-of-three', 'svg', function() {
    var textElement;
    return {
        //contentRule: 'replace',
        size: { width: 120, height: null },
        first: function(bodyElm) {
            textElement = svgNode('text');
            bodyElm.appendChild(textElement);
        },
        always: function(bodyElm, inlets, outlets) {
            textElement.innerHTML = '∑ (' + (inlets.a || '?') + ', '
                                          + (inlets.b || '?') + ', '
                                          + (inlets.c || '?') + ') = ' + (outlets.sum || '?');
        }
    }
});

/* ========================= util/knob & util/knobs ========================= */

var adaptToState = RpdUtils.adaptToState;

var KNOB_SPEED = 1.5;

var KNOB_RADIUS = 13,
    KNOB_WIDTH = 40, // KNOB_RADIUS * 2 + MARGIN
    KNOB_HEIGHT = KNOB_WIDTH;

function createKnob(state) {
    var lastValue = 0;
    //var state = { min: 0, max: 100 };

    return {
        init: function(parent) {
            var hand, handGhost, face, text;
            var submit = Kefir.emitter();
            d3.select(parent)
              .call(function(bodyGroup) {
                  face = bodyGroup.append('circle').attr('r', KNOB_RADIUS)
                                  .style('fill', 'rgba(200, 200, 200, .2)')
                                  .style('stroke-width', 2)
                                  .style('stroke', '#000');
                  handGhost = bodyGroup.append('line')
                                  .style('visibility', 'hidden')
                                  .attr('x1', 0).attr('y1', 0)
                                  .attr('x2', 0).attr('y2', KNOB_RADIUS - 1)
                                  .style('stroke-width', 2)
                                  .style('stroke', 'rgba(255,255,255,0.1)');
                  hand = bodyGroup.append('line')
                                  .attr('x1', 0).attr('y1', 0)
                                  .attr('x2', 0).attr('y2', KNOB_RADIUS)
                                  .style('stroke-width', 2)
                                  .style('stroke', '#000');
                  text = bodyGroup.append('text')
                                  .style('text-anchor', 'middle')
                                  .style('fill', '#fff')
                                  .text(0);
              });
            Kefir.fromEvents(parent, 'mousedown')
                 .map(stopPropagation)
                 .flatMap(function() {
                     handGhost.style('visibility', 'visible');
                     var values =
                        Kefir.fromEvents(document.body, 'mousemove')
                            //.throttle(50)
                             .takeUntilBy(Kefir.fromEvents(document.body, 'mouseup'))
                             .map(stopPropagation)
                             .map(function(event) {
                                 var faceRect = face.node().getBoundingClientRect();
                                 return { x: event.clientX - (faceRect.left + KNOB_RADIUS),
                                          y: event.clientY - (faceRect.top + KNOB_RADIUS) };
                             })
                             .map(function(coords) {
                                 var value = ((coords.y * KNOB_SPEED * -1) + 180) / 360;
                                 if (value < 0) {
                                     value = 0;
                                 } else if (value > 1) {
                                     value = 1;
                                 }
                                 return value;
                            });
                     values.last().onValue(function(val) {
                         lastValue = val;
                         handGhost.attr('transform', 'rotate(' + (lastValue * 360) + ')')
                                  .style('visibility', 'hidden');
                         submit.emit(lastValue);
                     });
                     return values;
                 }).onValue(function(value) {
                     text.text(adaptToState(state, value));
                     hand.attr('transform', 'rotate(' + (value * 360) + ')');
                 });
            return submit;
        }
    }
}

function initKnob(knob, nodeRoot, id, count) {
    var submit;
    d3.select(nodeRoot).append('g')
      .attr('transform', 'translate(' + ((id * KNOB_WIDTH) + (KNOB_WIDTH / 2) - (count * KNOB_WIDTH / 2)) + ',0)')
      .call(function(knobRoot) {
          knob.root = knobRoot;
          submit = knob.init(knobRoot.node());
      });
    return submit;
}

Rpd.noderenderer('util/knob', 'svg', function() {
    var state = { min: 0, max: 100 };
    var knob = createKnob(state);

    return {
        size: { width: KNOB_WIDTH, height: KNOB_HEIGHT },
        first: function(bodyElm) {
            var submit = knob.init(bodyElm);
            return {
                'submit': { valueOut: submit }
            };
        },
        always: function(bodyElm, inlets, outlets) {
            state.min = inlets.min || 0;
            state.max = inlets.max || 0;
        }
    };
});

var DEFAULT_KNOB_COUNT = 4;

Rpd.noderenderer('util/knobs', 'svg', function() {
    var count = DEFAULT_KNOB_COUNT;
    var state = { min: 0, max: 100 };
    var knobs = [];
    for (var i = 0; i < count; i++) {
        knobs.push(createKnob(state));
    }
    var nodeRoot;

    return {
        size: { width: count * KNOB_WIDTH, height: KNOB_HEIGHT },
        //pivot: { x: 0, y: 0.5 },
        first: function(bodyElm) {
            var valueOut = Kefir.pool();
            nodeRoot = bodyElm;
            valueOut = Kefir.combine(
                knobs.map(function(knob, i) {
                    return initKnob(knob, nodeRoot, i, count).merge(Kefir.constant(0)); // so Kefir.combine will send every change
                })
            );
            return {
                'submit': { valueOut: valueOut }
            };
        },
        always: function(bodyElm, inlets, outlets) {
            state.min = inlets.min || 0;
            state.max = inlets.max || 0;
        }
    };
});

/* ========================= util/color ========================= */

var toHexColor = RpdUtils.toHexColor;

Rpd.noderenderer('util/color', 'svg', function() {
    var colorElm;
    return {
        size: { width: 50, height: 50 },
        first: function(bodyElm) {
            colorElm = svgNode('rect');
            colorElm.setAttributeNS(null, 'width', '30');
            colorElm.setAttributeNS(null, 'height', '30');
            colorElm.setAttributeNS(null, 'rx', '5');
            colorElm.setAttributeNS(null, 'ry', '5');
            colorElm.setAttributeNS(null, 'transform', 'translate(-15,-15)');
            colorElm.classList.add('rpd-util-color-display');
            bodyElm.appendChild(colorElm);
        },
        always: function(bodyElm, inlets, outlets) {
            colorElm.setAttributeNS(null, 'fill', toHexColor(outlets.color));
        }
    }
});

/* ========================= util/nodelist ========================= */

var NodeList = RpdUtils.NodeList;
var getNodeTypesByToolkit = RpdUtils.getNodeTypesByToolkit;

var nodeListSize = { width: 180, height: 300 };

var lineHeight = 22;  // find font-size?
var iconWidth = 11;
var inputWidth = nodeListSize.width - 40;
var inputHeight = 45;

Rpd.noderenderer('util/nodelist', 'svg', {
    size: nodeListSize,
    first: function(bodyElm) {

        var patch = this.patch;

        var nodeTypes = Rpd.allNodeTypes,
            nodeDescriptions = Rpd.allNodeDescriptions,
            toolkitIcons = Rpd.allToolkitIcons,
            nodeTypeIcons = Rpd.allNodeTypeIcons;

        var nodeTypesByToolkit = getNodeTypesByToolkit(nodeTypes);

        var bodyGroup = d3.select(bodyElm)
                           .append('g')
                           .attr('transform', 'translate(' + (-1 * nodeListSize.width / 2) + ','
                                                           + (-1 * nodeListSize.height / 2) + ')');
        var searchGroup = bodyGroup.append('g').classed('rpd-nodelist-search', true)
                                               .attr('transform', 'translate(12,12)');

        var nodeListSvg;

        var tookitElements = {},
            listElementsIdxByType = {};

        var nodeList = new NodeList({
            getPatch: function() { return patch; },
            buildList: function() {
                var listElements = [];

                var bodyRect = bodyGroup.node().getBoundingClientRect();

                var foreignDiv = bodyGroup.append(svgNode('foreignObject'))
                                       .append(htmlNode('div'))
                                       .style('width', (nodeListSize.width - 20) + 'px')
                                       .style('height', (nodeListSize.height - inputHeight) + 'px')
                                       .style('overflow-y', 'scroll')
                                       .style('position', 'fixed').style('left', 10 + 'px')
                                                                  .style('top', inputHeight + 'px');

                nodeListSvg = foreignDiv.append(svgNode('svg'))
                                        .classed('rpd-nodelist-list', true)
                                        .attr('width', (nodeListSize.width - 12) + 'px');
                var lastY = 0;

                nodeListSvg.append('g')
                  .call(function(g) {
                      Object.keys(nodeTypesByToolkit).forEach(function(toolkit) {

                          var toolkitGroup = g.append('g').classed('rpd-nodelist-toolkit', true)
                                              .attr('transform', 'translate(0,' + lastY + ')')
                           .call(function(g) {
                                if (toolkitIcons[toolkit]) g.append('text').attr('class', 'rpd-nodelist-toolkit-icon').text(toolkitIcons[toolkit]);
                                g.append('text').attr('class', 'rpd-nodelist-toolkit-name').text(toolkit)
                           });

                          tookitElements[toolkit] = toolkitGroup;

                          lastY += lineHeight;

                          g.append('g').classed('rpd-nodelist-nodetypes', true)
                           .call(function(g) {
                                nodeTypesByToolkit[toolkit].types.forEach(function(nodeTypeDef) {
                                    var nodeType = nodeTypeDef.fullName;
                                    g.append('g').classed('rpd-nodelist-nodetype', true)
                                      .attr('transform', 'translate(0,' + lastY + ')')
                                     .call(function(g) {

                                          var hasDescription = nodeDescriptions[nodeType] ? true : false;

                                          var elmData = { def: nodeTypeDef,
                                                          element: g,
                                                          hasDescription: hasDescription,
                                                          initialY: lastY };

                                          g.data(elmData);

                                          g.append('rect').attr('class', 'rpd-nodelist-item-bg')
                                                          .attr('x', 0).attr('y', -5).attr('rx', 5).attr('ry', 5)
                                                          .attr('width', nodeListSize.width - 20)
                                                          .attr('height', (hasDescription ? (lineHeight * 1.5) : lineHeight) - 5);
                                          g.append('text').attr('class', 'rpd-nodelist-icon').text(nodeTypeIcons[nodeType] || ' ')
                                                          .attr('x', (iconWidth / 2)).attr('y', 5);
                                          g.append('text').attr('class', 'rpd-nodelist-fulltypename')
                                                          .attr('transform', 'translate(' + (iconWidth + 4) + ',0)')
                                                          .text(nodeTypeDef.toolkit + '/' + nodeTypeDef.name)
                                          if (hasDescription) {
                                              lastY += (lineHeight * 0.5);
                                              g.select('rect').attr('title', nodeDescriptions[nodeType]);
                                              g.append('text').attr('class', 'rpd-nodelist-description')
                                                              .attr('transform', 'translate(3,' + (lineHeight * 0.6) + ')')
                                                              .text(nodeDescriptions[nodeType]);
                                          }

                                          listElements.push(elmData);

                                          listElementsIdxByType[nodeType] = listElements.length - 1;

                                          lastY += lineHeight;

                                      });
                                });
                           });

                      });
                  });

                nodeListSvg.attr('height', lastY + 'px');

                return listElements;
            },
            recalculateSize: function(listElements) {
                var lastY = 0;

                Object.keys(nodeTypesByToolkit).forEach(function(toolkit) {
                    tookitElements[toolkit].attr('transform', 'translate(0,' + lastY + ')');

                    lastY += lineHeight;

                    var elmDataIdx, elmData;

                    nodeTypesByToolkit[toolkit].types.forEach(function(nodeTypeDef) {
                        elmDataIdx = listElementsIdxByType[nodeTypeDef.fullName];
                        elmData = listElements[elmDataIdx];

                        if (elmData.visible) {
                            elmData.element.attr('transform', 'translate(0,' + lastY + ')');
                            lastY += lineHeight;
                            if (elmData.hasDescription) lastY += (lineHeight * 0.5);
                        }

                    });

                });

                nodeListSvg.attr('height', lastY + 'px');
            },
            createSearchInput: function() {
                var foElm = svgNode('foreignObject');
                foElm.setAttributeNS(null, 'width', inputWidth);
                foElm.setAttributeNS(null, 'height', 20);
                var input = htmlNode('input');
                input.setAttribute('type', 'text');
                input.style.width = inputWidth + 'px';
                foElm.appendChild(input);
                searchGroup.append(foElm);
                return d3.select(input);
            },
            createClearSearchButton: function() {
                searchGroup.append('rect').attr('transform', 'translate(' + (nodeListSize.width - 32) + ',7)')
                           .attr('width', 12).attr('height', 12).attr('rx', 5);
                return searchGroup.append('text').text('x')
                                  .attr('transform', 'translate(' + (nodeListSize.width - 26) + ',12)');
            },
            clearSearchInput: function(searchInput) { searchInput.node().value = ''; },
            markSelected: function(elmData) { elmData.element.classed('rpd-nodelist-selected', true); },
            markDeselected: function(elmData) { elmData.element.classed('rpd-nodelist-selected', false); },
            markAdding: function(elmData) { elmData.element.classed('rpd-nodelist-add-effect', true); },
            markAdded: function(elmData) { elmData.element.classed('rpd-nodelist-add-effect', false); },
            setVisible: function(elmData) { elmData.element.style('display', 'list-item'); },
            setInvisible: function(elmData) { elmData.element.style('display', 'none'); }
        });

        nodeList.addOnClick();
        nodeList.addSearch();
        nodeList.addCtrlSpaceAndArrows();

    }
});

})();
