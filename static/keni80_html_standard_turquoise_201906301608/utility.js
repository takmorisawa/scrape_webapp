/*jslint browser: true*/
/*global $, jQuery, alert*/
jQuery.noConflict();

(function ($) {
	'use strict';

	var conf = {
			/**
			 * 初期設定
			*/

			/* スムーススクロールに関する設定 */
			smooth_scroll: {
				// TOPに戻るボタンの表示を表示するスクロール量
				top: 100
			},
			/* ブレークポイントに関する設定 */
			brakepoint: {
				// レスポンシブ時のブレークポイント（この値位以上の画面幅でPC表示になります）
				medium: 768
			},
			lp_header: {
				// LPの全画面表示の最大値です（これ以上の高さにしないという制限値）
				max_height: 1500
			},
			/* スライダーに関する設定 */
			slider: {
				// スライダー画像の停止時間
				time: 5000,
				// ブラウザのタブ移動などから戻ってきた際のスライダー再始動開始時間
				weight: 1000
			},
			/* SNSカウント数に関する設定 */
			sns: {
				// カウントの初期値
				count: 0
			}
		},

		/*
		 * 以下は本スクリプト内で使用する変数群になります。
		 */

		/* SPメニュー展開判定用変数 */
		sp_menu_lock = false,
		scroll_top,

		/* スクロール処理用のロック変数 */
		scroll_lock = false,

		/* ウィンドウスクロール時の処理用の変数 */
		topBtn,
		footerPanel,
		panelDiff,
		keniContainer,

		/* アンカーリンク用の変数 */
		anchor = localStorage.getItem('anchor'),

		/* SPのグローバルメニュー用処理の変数 */
		menu,
		body,
		menuBtn,
		clickSpace,
		menuWidth,

		/* PCのグローバルメニュー用処理の変数 */
		hoverIn,
		hoverOut,

		/* スクロールでヘッダーとフッターパネルを固定用の変数 */
		hdrTop,

		/* 目次の開閉用の変数 */
		tocList,

		/* SNSボタンの設置とカウント数の取得の変数 */
		pageurl,
		pagetitle,

		/* スライダー用の変数 */
		start,
		$pager      = $('.keni-slider-pager'),
		$slidesWrap = $('.keni-slider_outer'),
		$nav        = $('.keni-slider-nav'),
		$slides     = $('.keni-slider'),
		$slideImg   = $slides.find('img'),
		current     = 0,
		number      = $slideImg.length,
        windowWidth = $(window).outerWidth(),
        slider_lock = false,
        isPc = false;


	/**
	 * 画像にマウスカーソルが乗った際に、自動的に画像の置き換えをします。
	 * 画像の自動置き換えをするには、画像ファイルの末尾に「_off」「_on」を付けるてください。
	 * 例）
	 * ・image_off.jpg
	 * ・image_on.jpg
	 */

	/* ページ読み込み時に対象となる要素にクラスを振る処理です */
	$('img,input').each(function () {
		var src = $(this).attr('src');
		if (src) {
			if (src.match(/_off\./) || src.match(/_on\./)) {
				$(this).addClass('fn-over-img');
			}
		}
	});

	/* 対象となる要素にマウスカーソルが乗った際に画像を差し替える処理です */
	$('.fn-over-img').hover(function () {
		var src = $(this).attr('src');
		if (src.match(/_off\./)) {
			$(this).attr('src', src.replace('_off.', '_on.'));
		}
		if (src.match(/_on\./)) {
			$(this).attr('src', src.replace('_on.', '_off.'));
		}
	});


	/**
	 * ウィンドウスクロール時の処理です。
	 * スクロール量に応じて、ページ下部の「上へ戻る」ボタンやそれに相当するボタン類の表示非表示をコントロールします。
	 * a. PC
	 *    → ページ下部に「上へ戻る」ボタンを表示します
	 * b. スマートフォン
	 *    → ページ下部に「上へ戻る」や「お問い合わせ」など導線ボタン類を表示します
	 */

	topBtn        = $('.page-top');
	footerPanel   = $('.keni-footer-panel_wrap');
	panelDiff     = $('.keni-footer-panel_wrap').outerHeight();
	keniContainer = $('.keni-container');

	topBtn.hide();
	footerPanel.addClass('fn-footer-panel');

	$(window).scroll(function () {

		if (window.innerWidth < conf.brakepoint.medium && $('.utility-menu').length > 0) {

			topBtn.fadeOut();

			if (!keniContainer.hasClass('fn-keni-container')) {
				keniContainer.addClass('fn-keni-container');
				keniContainer.css('padding-bottom', panelDiff + 'px');
			}

			if ($(this).scrollTop() > conf.smooth_scroll.top) {
				if (!footerPanel.hasClass('is-active') && scroll_lock === false) {
					footerPanel.addClass('is-active');
				}
			} else {
				if (footerPanel.hasClass('is-active') && scroll_lock === false) {
					footerPanel.removeClass('is-active');
				}
			}
		} else {

			if (keniContainer.hasClass('fn-keni-container')) {
				keniContainer.removeClass('fn-keni-container');
				keniContainer.css('padding-bottom', '0');
			}

			if ($(this).scrollTop() > conf.smooth_scroll.top) {
				topBtn.fadeIn();
			} else {
				topBtn.fadeOut();
			}
		}
	});


	/**
	 * link ref="canonical"に指定された、href を取得する
     * link タグの ref = canonical に指定された、href
	 * 見つからなかった場合、null
	 * @return href | null
	 */
	function getCanonicalUrl() {

		var links = document.getElementsByTagName("link");
		for (var i = 0; i < links.length; i++) {
			if (links[i].rel) {
				if (links[i].rel.toLowerCase() == "canonical") {
					return links[i].href;
				}
			}
		}

		return null;
	}

	/**
	 * アンカーリンクをクリックした際の処理です。
	 * スムーズスクロールには2通りの動きが割り当てられています
	 * 1. ページ内移動
	 *    → 該当するIDの要素までスムーズスクロールします
	 * 2. 他ページへのアンカーリンク
	 *    → ページ遷移後に該当するIDの要素までスムーズスクロールします
	 */

	function hideFooterPanel() {
		if (footerPanel.hasClass('is-active')) {
			footerPanel.removeClass('is-active');
		}
	}

	/* アンカーへのスクロール（1および2で共通利用） */
	function scrollToAnchor(s) {
		if(s.match(/jpg/) || s.match(/png/) || s.match(/gif/)){
			return true;
		}
		var target = (s === "#" || s === "" ? 'html' : s),

			offsetTop,
			fltHdrHeight = $('.keni-header_wrap').height();

		offsetTop	 = $(target).offset().top;

		if (offsetTop <= conf.smooth_scroll.top) {
			hideFooterPanel();
		}

		var keniHeaderCont = 0;

		if($('.keni-header_cont').css('display') == 'block') {
			keniHeaderCont = $('.keni-header').innerHeight();
			if(typeof keniHeaderCont == 'undefined' || typeof keniHeaderCont == null) {
				keniHeaderCont = 0;
			}
		}

		if (window.innerWidth < conf.brakepoint.medium) {
			$('html,body').animate({ scrollTop: offsetTop - fltHdrHeight + keniHeaderCont }, 'slow', 'swing', function () {
				scroll_lock = false;
			});
		} else {
			$('html,body').animate({ scrollTop: offsetTop }, 'slow', 'swing', function () {
				scroll_lock = false;
			});
		}
		return false;
	}

	/* 1. ページ内移動でスクロールする処理です */
	// $('# a[href^="#"]').on('click', function () {
	// 	var href = $(this).attr('href');
	// 	scroll_lock = true;
	// 	scrollToAnchor(href);
	// 	return false;
	// });
	$('a').on('click', function () {
		var href = $(this).attr('href');
		if ( href.indexOf('#') > 0 ) {
            href = href.substr(href.indexOf('#'));
        }
		if( $(this).attr('href').substr(0,3) == 'tel' ) {
			return true;
		}
		scroll_lock = true;
		sp_menu_lock = false;
		$('.keni-gnav_inner').hide();
		$('#click-space').css('height','0');
		$('.keni-gnav_btn_icon-close').addClass('keni-gnav_btn_icon-open').removeClass('keni-gnav_btn_icon-close');
		$('.keni-header_wrap').addClass('fixed');
		$(body).css('overflow','scroll');
		return scrollToAnchor(href);
	});
	
	/* 2. 他ページへのアンカーリンクでスクロールする処理です
	$('a').on('click', function () {

		var href = $(this).attr('href'),
			hash = null;
		if (href.match(/[\-\/._0-9a-zA-Z]+#[\-._0-9a-zA-Z]+/)) {
			hash = href.split('#');
			localStorage.setItem('anchor', '#' + hash[1]);
			location.href = hash[0];
			return false;
		}
	});*/

	/* ページ読み込み時に、動的に要素の高さが変わるLPヘッダーがない場合で、anchorに値がある場合アンカーへスクロールする */
	if (!$('.keni-lp .keni-header_wrap').length && anchor) {
		scrollToAnchor(anchor);
		anchor = null;
		localStorage.removeItem('anchor');
	}


	/**
	 * SPのグローバルメニュー用処理です
	 */

	menu       = $('.keni-gnav_inner');
	body       = $(document.body);
	menuBtn    = $('.keni-gnav_btn');
	clickSpace = $('#click-space');
	menuWidth  = menu.outerWidth();

	$(window).resize(function () {
		var menuWidth  = menu.outerWidth();
	});

	if ($('.keni-gnav').hasClass('keni-gnav-scrolling-touch')) {
		$('.keni-gnav_inner').css({'-webkit-overflow-scrolling':'touch','overflow-scrolling':'touch'});
	}

	menuBtn.on('click', function () {

		if ($(this).find('span').hasClass('keni-gnav_btn_icon-open')) {
			sp_menu_lock = true;
    	scroll_top = $(window).scrollTop();
			menu.slideDown();
			$(this).find('.keni-gnav_btn_icon-open').addClass('keni-gnav_btn_icon-close');
			$(this).find('.keni-gnav_btn_icon-open').removeClass('keni-gnav_btn_icon-open');
			clickSpace.css({'width': '100%', 'height': '100%'});
			$(body).css('overflow','hidden');
			$('.keni-gnav_inner').css({'bottom':'0'});
		} else {
			menu.slideUp('fast');
			$(this).find('.keni-gnav_btn_icon-close').addClass('keni-gnav_btn_icon-open');
			$(this).find('.keni-gnav_btn_icon-close').removeClass('keni-gnav_btn_icon-close');
			clickSpace.css({'width': 0, 'height': 0});
			$('.keni-container').css({'position':'static'});
			$(body).css('overflow','scroll');
			$('.keni-gnav_inner').css({'bottom':'0'});
			$(window).scrollTop(scroll_top);
			sp_menu_lock = false;
    	scroll_top = 0;
		}
	});

	clickSpace.on('click', function () {
    menu.slideUp('fast');
    menuBtn.find('.keni-gnav_btn_icon-close').addClass('keni-gnav_btn_icon-open');
    menuBtn.find('.keni-gnav_btn_icon-close').removeClass('keni-gnav_btn_icon-close');
    clickSpace.css({'width': 0, 'height': 0});
    $('.keni-container').css({'position':'static'});
    $('.keni-gnav_inner').css({'bottom':'0'});
    $(window).scrollTop(scroll_top);
    $(body).css('overflow','scroll');
    sp_menu_lock = false;
    scroll_top = 0;
});

	$('.keni-gnav li').has('ul').append('<span class="keni-gnav-child_btn"></span>');
	$('.keni-gnav li').has('ul').addClass('keni-gnav-child_btn_icon-open').addClass('fn-gnav-toggle-children');

	$(document).on('click', '.keni-gnav-child_btn', function () {
		if ($(this).parent('li').hasClass('keni-gnav-child_btn_icon-open')) {
			$(this).parent('li').addClass('keni-gnav-child_btn_icon-close');
			$(this).parent('li').removeClass('keni-gnav-child_btn_icon-open');
			$(this).siblings('li').slideDown();
		} else {
			$(this).parent('li').addClass('keni-gnav-child_btn_icon-open');
			$(this).parent('li').removeClass('keni-gnav-child_btn_icon-close');
			$(this).siblings('li').slideUp();
		}
	});

	$(document).on('click', '.btn_share', function () {
		$(".keni-footer-panel_sns").slideToggle('fast');
	});


	/**
	 * PCのグローバルメニュー用処理です
	 */

	hoverIn  = function () {
		$(this).addClass('keni-gnav-child_btn_icon-close');
		$(this).removeClass('keni-gnav-child_btn_icon-open');
	};
	hoverOut = function () {
		$(this).addClass('keni-gnav-child_btn_icon-open');
		$(this).removeClass('keni-gnav-child_btn_icon-close');
	};
	function desktopNav() {
		if (window.innerWidth > conf.brakepoint.medium) {
			$('.keni-gnav li').has('ul').hover(hoverIn, hoverOut);
		} else {
			$('.keni-gnav li').has('ul').off('mouseenter mouseleave');
		}
	}
	desktopNav();
	$(window).resize(function () {
		desktopNav();
	});


	/**
	 * スクロールでヘッダーとフッターパネルを固定
	 */

	hdrTop = $('.keni-header_wrap').offset().top;
	function resetPanel() {
		$('.keni-header_wrap').removeClass('fixed');
		$('.keni-gnav_btn').removeClass('fixed');
		$('.keni-footer-panel_wrap').removeClass('fixed-bottom');
		$('.keni-container').css('padding-top', 0);
		$('.keni-container').css('padding-bottom', 0);
		$('.keni-header_col1 .keni-header_cont').slideDown('fast');
	}
	$(window).on('scroll resize', function () {

	  // SPメニューが非展開時にのみ本動作を行います
	  if (sp_menu_lock === false) {

  		var hdr            = $('.keni-header_wrap'),
  			ftrPanel       = $('.keni-footer-panel_wrap'),
  			gnavBtn        = $('.keni-gnav_btn'),
  			hdrHeight      = $('.keni-header_wrap').outerHeight(),
  			ftrPanelHeight = $('.keni-footer-panel_outer').height();

  		if (window.innerWidth < conf.brakepoint.medium) {
  			if ($(window).scrollTop() > hdrTop) {
  				hdr.addClass('fixed');
  				gnavBtn.addClass('fixed');
  				ftrPanel.addClass('fixed-bottom');
  				$('.keni-container').css('padding-top', hdrHeight);
  				$('.keni-container').css('padding-bottom', ftrPanelHeight);
				$('.keni-header_col1 .keni-header_cont').slideUp('fast');
  			} else {
  				resetPanel();
  			}
  		} else {
  			resetPanel();
  		}
		}
	});


	/**
	 * キービジュアルを画面の高さいっぱいにしたい場合の処理です。
	 */

	function lpHeader() {

		var winHeight    = $(window).height(),
			lpHdrHeight  = ($('.keni-lp .keni-header_wrap').length) ? $('.keni-lp .keni-header_wrap').height() : 0,
			lpGnavHeight = ($('.keni-lp .keni-gnav_wrap').length) ? $('.keni-lp .keni-gnav_wrap').height() : 0;

		if (window.innerWidth < conf.brakepoint.medium) {
			$('.keni-lp .keni-mv_outer').css({
				height   : (winHeight - lpHdrHeight) + 'px',
				maxHeight: conf.lp_header.max_height + 'px'
			});
		} else {
			$('.keni-lp .keni-mv_outer').css({
				height   : (winHeight - lpHdrHeight - lpGnavHeight) + 'px',
				maxHeight: conf.lp_header.max_height + 'px'
			});
		}
		/* 要素の高さセット後、anchorに値がある場合アンカーへスクロールする */
		if (anchor) {
			scrollToAnchor(anchor);
			anchor = null;
			localStorage.removeItem('anchor');
		}
	}
	lpHeader();
	$(window).resize(function () {
		lpHeader();
	});


	/**
	 * アコーディオン
	 */

	$('.accordion-list_cont').hide();
	$('.accordion-list_btn').css('cursor', 'pointer');
	$('.accordion-list_btn').on('click', function () {
		$(this).next('.accordion-list_cont').slideToggle();
		$(this).toggleClass('accordion-list_btn_open');
	});


	/**
	 * タブメニュー
	 */
    $('.tab-conts > li').not('.tab-conts li:first-child').hide();
    $('.tab-box > .tab-menu > li').on('click', function(){
        if ($(this).hasClass('tab-menu_select')) {
            return false;
        } else {
            var tabbox = $('.tab-box'),
                thisTabBox = $(this).closest('.tab-box'),
                thisTabIndex = $(this).parent().children('li').index(this),
                thisLength = $(this).closest('.tab-box').index('.tab-box'),
                tabContsList = tabbox.eq(thisLength).find('.tab-conts > li');
            tabContsList.hide();
            tabContsList.eq(thisTabIndex).show().addClass('tab-menu_select');
            tabbox.eq(thisLength).find('.tab-menu > li').removeClass('tab-menu_select');
            $(this).addClass('tab-menu_select');
        }
    });

	/**
	 * 目次の開閉
	 */

	tocList = $('.toc-area_list');
	$('.toc-area_btn').on('click', function () {
		if ($(this).hasClass('toc-area_btn_close')) {
			$(this).addClass('toc-area_btn_open');
			$(this).removeClass('toc-area_btn_close');
			tocList.slideUp('fast');
		} else {
			$(this).addClass('toc-area_btn_close');
			$(this).removeClass('toc-area_btn_open');
			tocList.slideDown();
		}
	});



	/**
	 * SNSボタンの設置とカウント数の取得
	 * 初期状態では、現在表示されているページのカウント数を取得します。
	 * なお、タグにdata-url属性を指定することで特定のURLについてのカウント数を取得することができます。
	 * この際、twitter、はてぶについては、タグにdata-title属性にタイトルを指定しておく必要があります。
	 * 例）
	 * <div class="sns-btn_fb" data-url="http://example.com/" data-title="EXAMPLE"></div>
	 */

	pageurl   = getCanonicalUrl() || window.location.href;
	pagetitle = encodeURIComponent(document.title);

	/* twitter */
	$('.sns-btn_tw').each(function () {
		var $count_html,
			target_url = $(this).data('url') || pageurl,
			target_title = $(this).data('title') || pagetitle;

		target_url = encodeURI( target_url );

		$(this).append('<a target="_blank" href="https://twitter.com/share?url=' + target_url + '&text=' + target_title + '"><i class="fa fa-twitter" aria-hidden="true"></i><span>Tweet</span></a>');
	});

	/* facebook */
	var fbToken = '' // アクセストークンを設定してください
	$('.sns-btn_fb').each(function () {
		var $count_html,
			target_url = $(this).data('url') || pageurl,
			count = null;

		target_url = encodeURI( target_url );
		$(this).append('<a target="_blank" href="https://www.facebook.com/sharer/sharer.php?u=' + target_url + '"><i class="fa fa-facebook-official" aria-hidden="true"></i><span class="count_fb"></span></a>');
		$count_html = $(this).find('.count_fb');

		$.ajax({
			url     : 'https://graph.facebook.com/',
			dataType: 'jsonp',
			data    : {
				id: target_url,
				fields:'og_object{engagement},engagement',
				access_token:fbToken
			}
		})
		.done(function (data, textStatus, jqXHR) {
			try {
				console.log(data.og_object.engagement);
				count = Number(data.og_object.engagement.count);
				$count_html.html(count);
			} catch (e) {
				// 例外処理
				console.log(e);
			}
		}).fail(function (fail) {
			console.log(fail);
			$count_html.html(conf.sns.count);
		});
	});

	/* はてブ */
	$('.sns-btn_hatena').each(function () {
		var $count_html,
			target_url = $(this).data('url') || pageurl,
			target_title = $(this).data('title') || pagetitle,
			count = null;

		target_url = encodeURI( target_url );

		$(this).append('<a target="_blank" href="http://b.hatena.ne.jp/add?mode=confirm&url=' + target_url + '&title=' + target_title + '"><i class="f-hatena" aria-hidden="true"></i><span class="count_hatena"></span></a>');
		$count_html = $(this).find('.count_hatena');

		$.ajax({
			url     : 'https://b.hatena.ne.jp/entry.count',
			type    : 'get',
			dataType: 'jsonp',
			data    : {
				url: target_url
			}
		})
			.done(function (data, textStatus, jqXHR) {
				count = (typeof (data) === 'undefined' || !data) ? conf.sns.count : Number(data);
				$count_html.html(count);
			})
			.fail(function () {
				$count_html.html(conf.sns.count);
			});
	});

	/* Google+ */
	$('.sns-btn_gplus').each(function () {
		var $count_html,
			target_url = $(this).data('url') || pageurl;

		$(this).append('<a target="_blank" href="https://plus.google.com/share?url=' + target_url + '"><i class="fa fa-google-plus" aria-hidden="true"></i><span>+1</span></a>');
	});

	/* Line */
	$('.sns-btn_line').each(function () {
		var $count_html,
			target_url = $(this).data('url') || pageurl;

		$(this).append('<a href="http://line.me/R/msg/text/?' + target_url + '\"><i class="icon_line"></i><span>LINEで送る</span></a>');
	});

	/* Pocket */
	$('.sns-btn_pocket').each(function () {
		var $count_html,
			target_url = $(this).data('url') || pageurl,
			target_title = $(this).data('title') || pagetitle;

		$(this).append('<a href="http://getpocket.com/edit?url=' + target_url + '&title=' + target_title + '\" onclick="window.open(this.href, \'PCwindow\', \'width=550, height=350, menubar=no, toolbar=no, scrollbars=yes\'); return false;"><i class="fa fa-get-pocket" aria-hidden="true"></i><span>Pocket</span></a>');
	});


	/**
	 * スライダー用の処理です
	 * スライダーは、表示したい画像を追加すると自動的にその数が増えます。
	 */

	$(window).focus();

    function setImgVisible($elems, visiblity) {
        $elems.each(function (i) {
            $(this).css("display", visiblity);
        });
    }

    function findSlideImg() {
        var pcImgs = [],
            spImgs = [],
            returnImgs;

        isPc = windowWidth >= 768 ? true : false;

        $slides.find('img').each(function (i) {
            var $this = $(this);
            if ($this.hasClass('show-pc')) {
                pcImgs.push($this);
            } else if ($this.hasClass('show-sp')) {
                spImgs.push($this);
            } else {
                pcImgs.push($this);
                spImgs.push($this);
            }
        });

        if (isPc) {
            setImgVisible($(spImgs), "none");
            setImgVisible($(pcImgs), "block");
        } else {
            setImgVisible($(pcImgs), "none");
            setImgVisible($(spImgs), "block");
        }

        returnImgs = isPc ? $(pcImgs) : returnImgs = $(spImgs);

        return returnImgs;
    }

    function navUpdate() {
        $nav.find('a').removeClass('keni-slider-nav_active');
        $nav.find('a').eq(current).addClass('keni-slider-nav_active');
    }

    function slider(index) {
        if (index < 0) {
            index = number - 1;
        }
        if (index > number - 1) {
            index = 0;
        }
        $slides.animate({
            left: -100 * index + '%'
        });
        current = index;
        navUpdate();
    }

    function timerStop() {
        clearInterval(start);
    }

    function timerStart() {
        timerStop();
        start = setInterval(function () {
            slider(current + 1);
        }, conf.slider.time);
    }

    function sliderCreator() {

        if (!slider_lock) {

            timerStop();

            slider_lock = true;

            $(".keni-slider-pager, .keni-slider-nav").remove();

            $('.keni-slider_outer').append('<ul class="keni-slider-pager"><li><a href="#" class="keni-slider-pager_prev"></a></li><li><a href="#" class="keni-slider-pager_next"></a></li></ul><div class="keni-slider-nav"></div>');

            $pager      = $('.keni-slider-pager');
            $slidesWrap = $('.keni-slider_outer');
            $nav        = $('.keni-slider-nav');
            $slides     = $('.keni-slider');
            $slideImg   = $(findSlideImg());
            current     = 0;
            number      = $slideImg.length;
            windowWidth = $(window).outerWidth();

            $slideImg.each(function (i) {
							if( $slidesWrap.height() < $(this).height() ){
								$(this).css({
									'top' : '-50%'
								});
							}
              $(this).css({
                  left: 100 * i + '%'
              });
							$nav.append('<a href="#"></a>');
            });

            $pager.find('a').on('click', function (event) {
                timerStop();
                event.preventDefault();
                if ($(this).hasClass('keni-slider-pager_prev')) {
                    slider(current - 1);
                } else {
                    slider(current + 1);
                }
                timerStart();
            });

            $nav.find('a').on('click', function (event) {
                timerStop();
                event.preventDefault();
                var navIndex = $(this).index();
                navUpdate();
                slider(navIndex);
                timerStart();
            });

            slider(current);

            timerStart();

            $slideImg.on({
                mouseover: timerStop,
                mouseout: timerStart
            });

        }

    }

    /* setInterval特有の問題を解消するために、このウィンドウからフォーカスがはずれたらsetintervalをクリアし再度実行する処理です */
    $(window).bind('focus', function () {
        timerStop();
        timerStart();
    });

    $(window).resize(function () {
        var width = $(window).outerWidth();
        if ((width >= 768 && !isPc) || (width < 768 && isPc)) {
            slider_lock = false;
            sliderCreator();
        }
    });

    sliderCreator();

 		// target="_blank"にrel="noopener"を追加する処理
		$('a').each(function(){
			if($(this).attr('target') === false) {
				return;
			}
			if($(this).attr('target') !== '_blank') {
				return;
			}
			$(this).attr('rel', 'noopener');
		});
}(jQuery));
