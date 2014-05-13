function showWiki(page, edit, e, opts) {
    if (checkEvent(e))
        return true;
    var opts = opts || {};
    if (window.wkcur && wkcur.shown && wkcur.wkRaw == page.w && page.w && !page.reply) {
        WkView.restoreLayer(opts);
        return cancelEvent(e);
    }
    if ((window.wkcur && wkcur.hideTitle) || page.hide_title) {
        opts.hide_title = page.hide_title = 1;
    }
    var stat = opts.stat || ['wkview.js', 'wkview.css', 'wk.css', 'wk.js'];
    edit && stat.push('wysiwyg.js', 'wysiwyg.css');
    var params = {
        stat: stat,
        loader: !opts.noloader,
        onDone: function(title, html, options, script) {
            WkView.show(title, html, extend(options, opts), script, e);
            if(options.tab == "likes"){
                loadStatistiscTab();
            }
        },
        onFail: function(text) {
            return WkView.showError(text);
        }
    };
    if (nav.objLoc.claim) {
        page.claim = nav.objLoc.claim;
    }
    if (opts.preload) {
        extend(params, opts.preload);
    }

    ajax.post('wkview.php', extend({act: 'show',loc: nav.objLoc[0]}, page), params);
    return cancelEvent(e);
};

function loadStatistiscTab(){
    $("#wk_likes_tabs").append(
    '<div class="fl_l summary_tab">'+
        '<a class="summary_tab2" id="wk_likes_stats">'+
            '<div class="summary_tab3">' +
                '<nobr>VKstater</nobr>'+
            '</div>'+
        '</a>'+
    '</div>'
    );

    $('#wk_likes_stats').click(function(){
        $('#wk_likes_stats').parent().parent().find('.summary_tab_sel').each(function(){
            $(this).removeClass('fl_l summary_tab_sel');
            $(this).addClass('fl_l summary_tab');
        });

        $('#wk_likes_stats').parent().addClass('fl_l summary_tab_sel');

        window.postMessage({ type: "GET_LIKES_DATA" }, "*");

    });

}

