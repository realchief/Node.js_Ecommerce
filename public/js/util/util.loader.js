(function() {
    var checkLoadedImages = function () {
        var elements = $('.tab-content img.b-lazy');
        if (elements.length === 0) elements = $('img.b-lazy');
        if (elements && elements.length > 0 && !_.any(elements, function (el) { return el.className.indexOf('b-loaded') !== -1; })) {
            var bLazy = new Blazy();
            setTimeout(checkLoadedImages, 500);
        }
    };
    checkLoadedImages();
})();