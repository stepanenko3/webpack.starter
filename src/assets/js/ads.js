var canRunAds = true;

window.onload = function () {
    utils.loadJs('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', function() {
        [].forEach.call(document.getElementsByClassName('adsbygoogle'), function (t) {
            try {
                (adsbygoogle = window.adsbygoogle || []).push({});
            } catch (e) {
                console.error('ADS Error:', e);
            }
        })
    });
}