(function(dash, $) {

    dash.getTitle = function(title) {
        return title + ' - Imbo Dashboard';
    };

    dash.getUrl = function(url) {
        return dash.baseUrl + (dash.instance && dash.instance.length ? '/' + dash.instance : '') + url;
    };

    dash.showImage = function(id) {
        var viewer = $('#imgViewer');

        if (!id) {
            return $([Dashboard.main, viewer]).toggleClass('hide');
        }

        // Set title
        viewer.find('.title').text(id);

        // Inject image
        var holder = viewer.find('.imgHolder').addClass('loading').empty();
        var img = $('<img />', {
            src: dash.imgUrl + id,
            title: id,
            alt: id,
        }).on('load', function() { holder.removeClass('loading'); }).appendTo(holder);

        // Show viewer
        $([Dashboard.main, viewer]).toggleClass('hide');
        img.css('maxWidth', holder.width());
    };

    dash.loadImagePage = function(page) {
        var liClass = $(window).width() < 1320 ? 'span2' : null;
        $.getJSON(dash.getUrl('/instance/images'), { 'page': page }, function(res) {
            var parts = [];
            for (var i = 0, l = res.length; i < l; i++) {
                parts.push(dash.getImageThumbnailHtml(res[i], liClass));
            }

            dash.dump.html(parts.join(''));
            dash.buildPagination(page, !res.length);
        });
    };

    dash.getImageThumbnailHtml = function(data, liClass) {
        return [
            '<li' + (liClass ? ' class="' + liClass + '"' : '') + ' id="img-' + data.id + '">',
            '<a href="' + data.url.replace(/([a-f0-9]+)\?.*/g, "$1") + '" class="thumbnail">',
            '<img src="' + data.url + '" alt="' + data.id + '">',
            '</a></li>'
        ].join('');
    };

    dash.buildPagination = function(active, empty) {
        active = parseInt(active, 10);
        var el = $('.pagination')[empty ? 'addClass' : 'removeClass']('hide'), links = el.find('a');
        var first = Math.max(active - 4, 1), last = Math.min(links.last().attr('href').replace(/[^\d]/, ''), active + 4);
        $([links[0], links[1]]).parent()[active == 1 ? 'addClass' : 'removeClass']('hidden');
        $([links[11], links[12]]).parent()[active == last ? 'addClass' : 'removeClass']('hidden');
        el.find('.active').removeClass('active');
        var max = active + 4, p = (max >= last) ? last - (max - first) : first;
        for (var i = 2, l = links.length - 2; i < l; i++) {
            var cur = $(links[i]).attr('href', '#' + p).text(p);
            if (p == active) {
                cur.parent().addClass('active');
            }

            p++;
        }
    };

    dash.buildProgressBar = function() {
        return $('<progress value="0" max="100"></progress>');
    };

    dash.uploadQueue = {
        queue: [],
        url: null,
        current: null,
        reader: null,
        add: function(file, el) {
            console.log('add');
            if (!dash.uploadQueue.url) {
                dash.uploadQueue.url = $('#uploadForm').attr('action');
            }

            dash.uploadQueue.queue.push({
                'file'     : file,
                'progress' : el.find('progress').get(0),
                'el'       : el
            });

            if (!dash.uploadQueue.current) {
                dash.uploadQueue.next();
            }
        },
        next: function() {
            console.log('next');
            var item = dash.uploadQueue.current = dash.uploadQueue.queue.shift(), xhr;
            if (!item) { return; }

            var xhr = new XMLHttpRequest();
            xhr.upload.addEventListener('progress', dash.uploadQueue.onProgress,     false);
            xhr.upload.addEventListener('load',     dash.uploadQueue.onFileComplete, false);
            xhr.onreadystatechange = function(e) {
                if (xhr.readyState === 4) {
                    dash.uploadQueue.onTransferComplete(xhr);
                }
            };
            dash.uploadQueue.send(xhr, item);
        },
        send: function(xhr, item) {
            var method = 'fail';
            if (xhr.sendAsBinary && window.FileReader) {
                method = 'sendAsBinary';
            } else if (window.FormData) {
                method = 'formData';
            }

            dash.uploadQueue.sendHandlers[method](xhr, item);
        },
        sendHandlers: {
            sendAsBinary: function(xhr, item) {
                var reader = dash.uploadQueue.reader = dash.uploadQueue.reader || new FileReader();
                reader.onload = function(e) {
                    xhr.open('PUT', dash.uploadQueue.url, true);
                    xhr.sendAsBinary(e.target.result);
                };
                reader.readAsBinaryString(item.file);
            },
            formData: function(xhr, item) {
                var data = new FormData();
                data.append('file', item.file);

                xhr.open('POST', dash.uploadQueue.url, true);
                xhr.send(data);
            }
        },
        onProgress: function(e) {
            console.log('progress', e.lengthComputable);
            if (e.lengthComputable) {
                var percentage = Math.round((e.loaded * 100) / e.total);
                console.log(percentage, dash.uploadQueue.current.progress);
                dash.uploadQueue.current.progress.value = percentage;
            }
        },
        onFileComplete: function() {
            console.log('file complete');
            dash.uploadQueue.current.progress.value = 100;
        },
        onTransferComplete: function(xhr) {
            if (xhr.status !== 200) {
                return alert('An error occured during upload (' + xhr.statusText + ')');
            }

            var data = JSON.parse(xhr.responseText);

            var item = dash.uploadQueue.current;
            var thumb = $(dash.getImageThumbnailHtml(data));
            thumb.find('img').get(0).onload = function() {
                item.el.replaceWith(thumb);
            };

            // Next file
            dash.uploadQueue.next();
        }
    };

    dash.dragUpload = function(e) {
        e.preventDefault();
        e.stopPropagation();
        dash.fileUpload(e.target.files || e.dataTransfer.files);
    };

    dash.fileUpload = function(files) {
        var blank = dash.baseUrl + '/img/blank.gif';

        for (var i = 0; i < files.length; i++) {
            if (files[i].size > Dashboard.maxUploadSize) {
                alert('File "' + files[i].fileName + '" is larger than the max size for this instance.');
                continue;
            }

            if ($.inArray(files[i].type, ['image/jpeg', 'image/gif', 'image/png']) < 0) {
                alert('File "' + files[i].fileName + '" is not recognized as a JPG, GIF or PNG.');
                continue;
            }

            // Build a new thumbnail element
            var data = { id: files[i].fileName, url: blank };
            var li = $(dash.getImageThumbnailHtml(data)).addClass('placeholder');

            // Push progress bar
            li.append(dash.buildProgressBar);

            // Can we generate actual thumbnails?
            if (window.FileReader) {
                var img = li.find('img').get(0), reader = new FileReader();
                reader.onload = (function(img) {
                    return function(e) {
                        img.src = e.target.result;
                    };
                })(img);
                reader.readAsDataURL(files[i]);
            }

            // Append the li-element
            dash.dump.prepend(li);

            // Queue upload
            dash.uploadQueue.add(files[i], li)
        }

    };

})(window.Dashboard, jQuery);

jQuery(document).ready(function($) {

    var dash = Dashboard;
    dash.main = $('section.main');
    dash.dump = $('#dump');

    // Listen for keyboard shortcuts
    $(window).on('keyup', function(e) {
        switch (e.keyCode) {
            case 27: // Escape
                if (dash.main.hasClass('hide')) {
                    $.bbq.removeState('img');
                }
                break;
        }
    });

    // Attach drag-and-drop upload
    if (window.XMLHttpRequest) {
        var xhr = new XMLHttpRequest();
        if (xhr.upload) {
            var body = $(document.body);
            document.addEventListener('drop', dash.dragUpload, false);
            document.addEventListener('dragover', function(e) {
                e.preventDefault();
            }, false);
        }
    }

    // Attach onclick handlers to images
    $('.img-view').on('click', 'li > a', function(e) {
        // Don't catch "open in new window" clicks
        if (e.altKey || e.ctrlKey || e.shiftKey || e.metaKey || (e.which && e.which == 2)) {
            return;
        }

        // Fetch image ID
        var imgId = $(this).closest('li').attr('id').replace(/^img-/, '');

        // Push state and prevent default click
        $.bbq.pushState({ img: imgId });
        return false;
    });

    // Attach pagination actions
    $('.pagination').on('click', 'a', function(e) {
        var el = $(this), root = el.closest('.pagination');
        e.preventDefault();

        if (el.hasClass('next') || el.hasClass('prev')) {
            page = parseInt(root.find('.active a').attr('href').replace(/[^\d/]/, ''), 10);
            page += el.hasClass('next') ? 1 : -1;
        } else {
            page = el.attr('href').replace(/[^\d/]/, '');
        }

        $.bbq.pushState({'page': page});
    });

    // Attach upload action
    var uploader = $('#imgUploader').on('change', function(e) {
        dash.fileUpload(this.files);
    });
    $('#topbar .upload').on('click', function(e) {
        e.preventDefault();
        uploader.get(0).click();
    });

    // Change thumbnail sizes based on window size
    var win = $(window), prevSize = win.width() < 1320 ? 'span2' : '';
    win.on('resize', function() {
        var newSize = win.width() < 1320 ? 'span2' : '';
        if (newSize != prevSize) {
            $('ul.thumbnails > li').toggleClass('span2');
            prevSize = newSize;
        }
    });

    // Trigger any states
    $(window).trigger('hashchange');
    if (!$.bbq.getState('page') && Dashboard.instance) {
        Dashboard.loadImagePage(1);
    }

});