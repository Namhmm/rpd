xdescribe('navigation', function() {

    var networkUpdatesSpy;
    var pathChangeSpy;
    var networkErrorSpy;

    var SEPARATOR = ';';

    beforeEach(function() {
        networkUpdatesSpy = jasmine.createSpy('network-updates');
        Rpd.events.onValue(networkUpdatesSpy);
        changePathSpy = jasmine.spyOn(Rpd.navigation, 'changePath');
        networkErrorSpy = jasmine.createSpy('network-errors');
        Rpd.events.onErrors(networkErrorSpy);
        Rpd.navigation.enable();
    });

    afterEach(function() {
        Rpd.navigation.disable();
        Rpd.events.offValue(networkUpdatesSpy);
    });

    describe('handling empty path', function() {

        it('opens first added patch', function() {
            var firstPatch = Rpd.addPatch('first');

            var secondPatch = Rpd.addPatch('second');

            networkUpdatesSpy.calls.reset();

            Rpd.navigation.handlePath('');

            expect(networkUpdatesSpy).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    type: 'patch/open',
                    patch: firstPatch
                }));

            expect(changePathSpy).toHaveBeenCalledWith(firstPatch.id);
        });

        it('opens first added patch even if it was closed before', function() {
            var firstPatch = Rpd.addPatch('first');
            firstPatch.close();

            var secondPatch = Rpd.addPatch('second');

            networkUpdatesSpy.calls.reset();

            Rpd.navigation.handlePath('');

            expect(networkUpdatesSpy).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    type: 'patch/open',
                    patch: firstPatch
                }));

            expect(changePathSpy).toHaveBeenCalledWith(firstPatch.id);
        });

        it('closes all other patches', function() {
            Rpd.addPatch('first');

            var secondPatch = Rpd.addPatch('second');
            var thirdPatch = Rpd.addClosedPatch('third');
            thirdPatch.open();

            networkUpdatesSpy.calls.reset();

            Rpd.navigation.handlePath('');

            expect(networkUpdatesSpy).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    type: 'patch/close',
                    patch: secondPatch
                }));
            expect(networkUpdatesSpy).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    type: 'patch/close',
                    patch: thirdPatch
                }));

            expect(changePathSpy).toHaveBeenCalledWith(firstPatch.id);

        });

    });

    describe('when path contains wrong ID or gibberish', function() {

        var GIBBER = 'gibber';

        it('fires an error, but opens first added patch', function() {
            var firstPatch = Rpd.addPatch('first');

            var secondPatch = Rpd.addPatch('second');

            networkUpdatesSpy.calls.reset();

            Rpd.navigation.handlePath(GIBBER);

            expect(networkErrorSpy).toHaveBeenCalled();

            expect(networkUpdatesSpy).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    type: 'patch/open',
                    patch: firstPatch
                }));

            expect(changePathSpy).toHaveBeenCalledWith('');
        });

        it('fires an error, opens first added patch even if it was closed before', function() {
            var firstPatch = Rpd.addPatch('first');
            firstPatch.close();

            var secondPatch = Rpd.addPatch('second');

            networkUpdatesSpy.calls.reset();

            Rpd.navigation.handlePath(GIBBER);

            expect(networkErrorSpy).toHaveBeenCalled();

            expect(networkUpdatesSpy).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    type: 'patch/open',
                    patch: firstPatch
                }));

            expect(changePathSpy).toHaveBeenCalledWith('');
        });

        it('fires an error, but yet closes all other patches', function() {
            Rpd.addPatch('first');

            var secondPatch = Rpd.addPatch('second');
            var thirdPatch = Rpd.addClosedPatch('third');
            thirdPatch.open();

            networkUpdatesSpy.calls.reset();

            Rpd.navigation.handlePath(GIBBER);

            expect(networkErrorSpy).toHaveBeenCalled();

            expect(networkUpdatesSpy).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    type: 'patch/close',
                    patch: secondPatch
                }));
            expect(networkUpdatesSpy).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    type: 'patch/close',
                    patch: thirdPatch
                }));

            expect(changePathSpy).toHaveBeenCalledWith('');
        });

        it('fires an error when path contains only separators', function() {

            Rpd.navigation.handlePath(SEPARATOR + SEPARATOR);

            expect(networkErrorSpy).toHaveBeenCalled();

            expect(changePathSpy).toHaveBeenCalledWith('');

        });

    });

    describe('when path contains single patch ID', function() {

        it('opens specified patch', function() {
            var firstPatch = Rpd.addPatch('first');

            var secondPatch = Rpd.addPatch('second');

            networkUpdatesSpy.calls.reset();

            Rpd.navigation.handlePath(secondPatch.id);

            expect(networkUpdatesSpy).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    type: 'patch/open',
                    patch: secondPatch
                }));

            expect(changePathSpy).not.toHaveBeenCalled();
        });

        it('opens specified patch even if it was closed before', function() {
            var firstPatch = Rpd.addPatch('first');

            var secondPatch = Rpd.addClosedPatch('second');

            networkUpdatesSpy.calls.reset();

            Rpd.navigation.handlePath(secondPatch.id);

            expect(networkUpdatesSpy).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    type: 'patch/open',
                    patch: secondPatch
                }));

            expect(changePathSpy).not.toHaveBeenCalled();
        });

        it('closes all other patches', function() {
            var firstPatch = Rpd.addPatch('first');
            var secondPatch = Rpd.addPatch('second');
            var thirdPatch = Rpd.addClosedPatch('third');
            thirdPatch.open();

            networkUpdatesSpy.calls.reset();

            Rpd.navigation.handlePath(secondPatch.id);

            expect(networkUpdatesSpy).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    type: 'patch/close',
                    patch: firstPatch
                }));

            expect(networkUpdatesSpy).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    type: 'patch/close',
                    patch: thirdPatch
                }));

            expect(changePathSpy).not.toHaveBeenCalled();
        });

    });

    describe('when path contains several patch IDs', function() {

        it('opens all patches specified in the list while they exist', function() {
            var firstPatch = Rpd.addClosedPatch('first');
            var secondPatch = Rpd.addPatch('second');
            var thirdPatch = Rpd.addClosedPatch('third');

            networkUpdatesSpy.calls.reset();

            Rpd.navigation.handlePath(thirdPatch.id + SEPARATOR + firstPatch.id + SEPARATOR + secondPatch.id);

            expect(networkUpdatesSpy).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    type: 'patch/open',
                    patch: firstPatch
                }));
            expect(networkUpdatesSpy).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    type: 'patch/open',
                    patch: thirdPatch
                }));
            expect(networkUpdatesSpy).not.toHaveBeenCalledWith(
                jasmine.objectContaining({
                    type: 'patch/close',
                    patch: secondPatch
                }));

            expect(changePathSpy).not.toHaveBeenCalled();
        });

        it('opens all patches specified in the list while they exist, even if there\'s a separator in the end', function() {
            var firstPatch = Rpd.addClosedPatch('first');
            var secondPatch = Rpd.addPatch('second');
            var thirdPatch = Rpd.addClosedPatch('third');

            networkUpdatesSpy.calls.reset();

            Rpd.navigation.handlePath(thirdPatch.id + SEPARATOR + firstPatch.id + SEPARATOR + secondPatch.id + SEPARATOR);

            expect(networkUpdatesSpy).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    type: 'patch/open',
                    patch: firstPatch
                }));
            expect(networkUpdatesSpy).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    type: 'patch/open',
                    patch: thirdPatch
                }));
            expect(networkUpdatesSpy).not.toHaveBeenCalledWith(
                jasmine.objectContaining({
                    type: 'patch/close',
                    patch: secondPatch
                }));

            expect(changePathSpy).toHaveBeenCalledWith(thirdPatch.id + SEPARATOR + firstPatch.id + SEPARATOR + secondPatch.id);
        });

        it('closed patches stay closed if they were not specified in the list', function() {
            var firstPatch = Rpd.addClosedPatch('first');
            var secondPatch = Rpd.addPatch('second');
            var thirdPatch = Rpd.addClosedPatch('third');

            networkUpdatesSpy.calls.reset();

            Rpd.navigation.handlePath(thirdPatch.id + SEPARATOR + secondPatch.id);

            expect(networkUpdatesSpy).not.toHaveBeenCalledWith(
                jasmine.objectContaining({
                    type: 'patch/open',
                    patch: firstPatch
                }));
            expect(networkUpdatesSpy).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    type: 'patch/open',
                    patch: thirdPatch
                }));

            expect(changePathSpy).not.toHaveBeenCalled();
        })

        it('do not opens patches which don\'t exist, fires an error for them, but fixes path', function() {
            var firstPatch = Rpd.addClosedPatch('first');
            var secondPatch = Rpd.addClosedPatch('second');
            var thirdPatch = Rpd.addClosedPatch('third');

            networkUpdatesSpy.calls.reset();

            Rpd.navigation.handlePath(thirdPatch.id + SEPARATOR + firstPatch.id + SEPARATOR + /*!*/GIBBER/*!*/ + secondPatch.id + SEPARATOR);

            expect(networkErrorSpy).toHaveBeenCalled();

            expect(networkUpdatesSpy).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    type: 'patch/open',
                    patch: firstPatch
                }));
            expect(networkUpdatesSpy).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    type: 'patch/open',
                    patch: thirdPatch
                }));
            expect(networkUpdatesSpy).not.toHaveBeenCalledWith(
                jasmine.objectContaining({
                    type: 'patch/open',
                    patch: secondPatch
                }));

            expect(changePathSpy).toHaveBeenCalledWith(thirdPatch.id + SEPARATOR + firstPatch.id);
        });

    });

    describe('reaction on patches opened by user', function() {

    });

});
