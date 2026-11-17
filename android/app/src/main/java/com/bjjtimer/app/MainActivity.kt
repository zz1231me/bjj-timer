package com.bjjtimer.app

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Bitmap
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private val timerUrl = "https://zz1231me.github.io/bjj-timer/"
    private val prefsName = "bjj_timer_prefs"
    private val keyLastRefresh = "last_refresh_date"

    private var errorRetried = false
    private val handler = Handler(Looper.getMainLooper())

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        @Suppress("DEPRECATION")
        window.addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN)
        window.addFlags(WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS)

        val needsRefresh = shouldRefreshToday()
        val online = isNetworkAvailable()

        try {
            webView = WebView(this).apply {
                settings.javaScriptEnabled = true
                settings.domStorageEnabled = true
                settings.mediaPlaybackRequiresUserGesture = false
                settings.databaseEnabled = true
                settings.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW

                settings.cacheMode = when {
                    needsRefresh && online -> WebSettings.LOAD_NO_CACHE
                    online -> WebSettings.LOAD_DEFAULT
                    else -> WebSettings.LOAD_CACHE_ELSE_NETWORK
                }

                webViewClient = object : WebViewClient() {
                    override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                        super.onPageStarted(view, url, favicon)
                    }

                    override fun onPageFinished(view: WebView?, url: String?) {
                        super.onPageFinished(view, url)
                        errorRetried = false
                        if (url != null && url.startsWith(timerUrl)) {
                            markRefreshedToday()
                            view?.settings?.cacheMode = WebSettings.LOAD_CACHE_ELSE_NETWORK
                        }
                    }

                    override fun onReceivedError(
                        view: WebView?,
                        request: WebResourceRequest?,
                        error: WebResourceError?
                    ) {
                        super.onReceivedError(view, request, error)
                        if (request?.isForMainFrame == true && !errorRetried) {
                            errorRetried = true
                            view?.settings?.cacheMode = WebSettings.LOAD_CACHE_ELSE_NETWORK
                            view?.loadUrl(timerUrl)
                        }
                    }
                }

                webChromeClient = WebChromeClient()

                addJavascriptInterface(WebAppInterface(this@MainActivity), "AndroidBridge")
            }
        } catch (e: Exception) {
            Toast.makeText(this, "WebView 초기화 실패", Toast.LENGTH_LONG).show()
            finish()
            return
        }

        setContentView(webView)
        applyFullscreen()

        ViewCompat.setOnApplyWindowInsetsListener(webView) { _, insets ->
            if (insets.isVisible(WindowInsetsCompat.Type.navigationBars()) ||
                insets.isVisible(WindowInsetsCompat.Type.statusBars())) {
                handler.postDelayed({ applyFullscreen() }, 500)
            }
            WindowInsetsCompat.CONSUMED
        }

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState)
        } else {
            webView.loadUrl(timerUrl)
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    fun applyFullscreen() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.setDecorFitsSystemWindows(false)
            window.insetsController?.let {
                it.hide(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars())
                it.systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            }
        } else {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                )
        }
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
        applyFullscreen()

        if (shouldRefreshToday() && isNetworkAvailable()) {
            webView.settings.cacheMode = WebSettings.LOAD_NO_CACHE
            webView.reload()
        }
    }

    override fun onPause() {
        webView.onPause()
        super.onPause()
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) applyFullscreen()
    }

    @Deprecated("Use OnBackPressedCallback instead")
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            @Suppress("DEPRECATION")
            super.onBackPressed()
        }
    }

    override fun onDestroy() {
        handler.removeCallbacksAndMessages(null)
        webView.removeJavascriptInterface("AndroidBridge")
        webView.destroy()
        super.onDestroy()
    }

    private fun todayString(): String {
        return SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
    }

    private fun shouldRefreshToday(): Boolean {
        val prefs = getSharedPreferences(prefsName, Context.MODE_PRIVATE)
        val last = prefs.getString(keyLastRefresh, "") ?: ""
        return last != todayString()
    }

    private fun markRefreshedToday() {
        getSharedPreferences(prefsName, Context.MODE_PRIVATE)
            .edit()
            .putString(keyLastRefresh, todayString())
            .apply()
    }

    private fun isNetworkAvailable(): Boolean {
        val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val net = cm.activeNetwork ?: return false
        val caps = cm.getNetworkCapabilities(net) ?: return false
        return caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }
}
