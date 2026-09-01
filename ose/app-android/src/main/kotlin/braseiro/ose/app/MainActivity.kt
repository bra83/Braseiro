package braseiro.ose.app

import android.annotation.SuppressLint
import android.app.Activity
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient

class MainActivity : Activity() {
    private lateinit var webView: WebView
    var lastBridgeMessage: BridgeEnvelopeMetadata? = null
        private set

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.allowFileAccess = true
            settings.allowContentAccess = false
            settings.domStorageEnabled = false
            webViewClient = WebViewClient()
            webChromeClient = WebChromeClient()
            addJavascriptInterface(BridgeEndpoint(), "BraseiroBridge")
            loadUrl("file:///android_asset/index.html?fixture=session-prestart")
        }
        setContentView(webView)
    }

    fun webViewForTest(): WebView = webView

    private inner class BridgeEndpoint {
        @JavascriptInterface
        fun postMessage(raw: String) {
            lastBridgeMessage = BridgeContractValidator.validate(raw)
        }
    }
}
