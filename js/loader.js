(function () {
    // Dynamic Version Loader
    const verScript = document.createElement('script');
    verScript.src = 'version.js?t=' + new Date().getTime();
    verScript.onload = function () {
        const config = window.STOCKX_CONFIG || {};
        // 1. Load CSS
        if (config.css) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'css/' + config.css;
            document.head.appendChild(link);
        }

        const loadBodyElements = () => {
            // 2. Load JS
            if (config.js) {
                const script = document.createElement('script');
                script.src = 'js/' + config.js;
                document.body.appendChild(script);
            }
            // 3. Check HTML Version
            const currentPage = window.location.pathname.split('/').pop() || 'index.html';
            if (config.html && config.html !== currentPage) {
                const msg = document.createElement('div');
                msg.style.cssText = 'position:fixed;top:0;left:0;width:100%;background:#ffeb3b;color:#000;text-align:center;padding:10px;z-index:9999;box-shadow:0 2px 5px rgba(0,0,0,0.2);';
                msg.innerHTML = `New version available! <a href="${config.html}">Click here to load ${config.html}</a>`;
                document.body.prepend(msg);
            }
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', loadBodyElements);
        } else {
            loadBodyElements();
        }
    };
    document.head.appendChild(verScript);

    

})();
