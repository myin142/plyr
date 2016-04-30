<?php
function base64($type, $file) { 
   return 'data:video/' . $type . ';base64,' . base64_encode(file_get_contents($file)); 
}
?>
<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <title>Plyr - A simple HTML5 media player</title>
        <meta name="description" content="A simple HTML5 media player with custom controls and WebVTT captions.">
        <meta name="author" content="Sam Potts">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <!-- Styles -->
        <link rel="stylesheet" href="../dist/plyr.css">

        <!-- Docs styles -->
        <link rel="stylesheet" href="dist/docs.css">
    </head>
    <body>
        <header>
            <h1>Plyr</h1>
            <p>A simple, accessible HTML5 media player by <a href="https://twitter.com/sam_potts" target="_blank">@sam_potts</a> from <a href="https://twitter.com/selz" target="_blank">@selz</a></p>
            <nav>
                <ul>
                    <li>
                        <a href="https://github.com/selz/plyr" target="_blank" class="btn btn--large btn--primary" data-shr-network="github">
                            <svg class="icon"><use xlink:href="#icon-github"/></svg>Download on GitHub
                        </a>
                    </li>
                    <li>
                        <a href="https://twitter.com/intent/tweet?text=A+simple+HTML5+media+player+with+custom+controls+and+WebVTT+captions.&url=http%3A%2F%2Fplyr.io&via=Sam_Potts" target="_blank" class="btn btn--large btn--twitter" data-shr-network="twitter">
                            <svg class="icon"><use xlink:href="#icon-twitter"/></svg>Tweet
                        </a>
                    </li>
                </ul>
            </nav>
        </header>

        <main role="main" id="main">
            <nav class="btn__bar">
                <ul>
                    <li class="active">
                        <button type="button" class="btn" data-source="video">Video</button>
                    </li>
                    <li>
                        <button type="button" class="btn" data-source="audio">Audio</button>
                    </li>
                    <li>
                        <button type="button" class="btn btn--youtube" data-source="youtube"><svg class="icon"><use xlink:href="#icon-youtube"/></svg>YouTube</button>
                    </li>
                    <li>
                        <button type="button" class="btn btn--vimeo" data-source="vimeo"><svg class="icon"><use xlink:href="#icon-vimeo"/></svg>Vimeo</button>
                    </li>
                </ul>
            </nav>
            <section>
                <div class="js-media-player">
                    <video controls crossorigin>
                        <!-- Video files -->
                        <source type="video/mp4" src="<?php echo base64("mp4", "SampleVideo_1280x720_1mb.mp4"); ?>">
                    </video>
                </div>

                <ul>
                    <li class="plyr__cite plyr__cite--video"><small><a href="http://viewfromabluemoon.com/" target="_blank">View From A Blue Moon</a> &copy; Brainfarm</small></li>
                    <li class="plyr__cite plyr__cite--audio"><small><a href="http://www.kishibashi.com/" target="_blank">Kishi Bashi &ndash; &ldquo;It All Began With A Burst&rdquo;</a> &copy; Kishi Bashi</small></li>
                    <li class="plyr__cite plyr__cite--youtube"><small><a href="https://www.youtube.com/watch?v=bTqVqk7FSmY" target="_blank">View From A Blue Moon</a> on <span class="color--youtube"><svg class="icon"><use xlink:href="#icon-youtube"/></svg>YouTube</span></small>
                    <li class="plyr__cite plyr__cite--vimeo"><small><a href="https://vimeo.com/ondemand/viewfromabluemoon4k" target="_blank">View From A Blue Moon</a> on <span class="color--vimeo"><svg class="icon"><use xlink:href="#icon-vimeo"/></svg>Vimeo</span></small>
                </ul>
            </section>
        </main>

        <!-- Load SVG defs -->
        <!-- You should bundle all SVG/Icons into one file using a build tool such as gulp and svg store -->
        <script>
        (function() {
            [
                '../dist/sprite.svg',
                'dist/docs.svg'
            ]
            .forEach(function(u) {
                var x = new XMLHttpRequest(),
                    b = document.body;

                // Check for CORS support
                // If you're loading from same domain, you can remove the whole if/else statement
                // XHR for Chrome/Firefox/Opera/Safari/IE10+
                if ('withCredentials' in x) {
                    x.open('GET', u, true);
                }
                // XDomainRequest for IE8 & IE9
                else if (typeof XDomainRequest == 'function') {
                    x = new XDomainRequest();
                    x.open('GET', u);
                }
                else { return; }

                // Inject hidden div with sprite on load
                x.onload = function() {
                    var c = document.createElement('div');
                    c.setAttribute('hidden', '');
                    c.innerHTML = x.responseText;
                    b.insertBefore(c, b.childNodes[0]);
                }

                // Timeout for IE9
                setTimeout(function () {
                    x.send();
                }, 0);
            });
        })();
        </script>

        <!-- Plyr core script -->
        <script src="../src/js/plyr.js"></script>

        <!-- Docs script -->
        <script src="dist/docs.js"></script>

        <!-- Rangetouch to fix <input type="range"> on touch devices (see https://rangetouch.com) -->
        <script src="https://cdn.rangetouch.com/0.0.9/rangetouch.js"></script>

        <!-- Sharing libary (https://shr.one) -->
        <script src="https://cdn.shr.one/0.1.9/shr.js"></script>
        <script>if(window.shr) { window.shr.setup({ count: { classname: 'btn__count' } }); }</script>
    </body>
</html>