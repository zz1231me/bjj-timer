package com.bjjtimer.app

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.view.WindowManager
import android.webkit.JavascriptInterface
import androidx.appcompat.app.AppCompatActivity

class WebAppInterface(private val activity: AppCompatActivity) {

    private var audioFocusRequest: AudioFocusRequest? = null

    @JavascriptInterface
    fun keepScreenOn(on: Boolean) {
        activity.runOnUiThread {
            if (on) {
                activity.window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            } else {
                activity.window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            }
        }
    }

    @JavascriptInterface
    fun setFullscreen(@Suppress("UNUSED_PARAMETER") on: Boolean) {
        activity.runOnUiThread {
            (activity as? MainActivity)?.applyFullscreen()
        }
    }

    @JavascriptInterface
    fun vibrate(ms: Long) {
        vibrateOnce(ms)
    }

    @JavascriptInterface
    fun vibratePattern(pattern: String) {
        try {
            val parts = pattern.split(",").map { it.trim().toLong() }
            if (parts.isEmpty()) return
            val vibrator = getVibrator()
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator.vibrate(
                    VibrationEffect.createWaveform(
                        longArrayOf(0, parts[0], parts.getOrElse(1) { 100 }, parts.getOrElse(2) { parts[0] }),
                        -1
                    )
                )
            } else {
                @Suppress("DEPRECATION")
                vibrator.vibrate(
                    longArrayOf(0, parts[0], parts.getOrElse(1) { 100 }, parts.getOrElse(2) { parts[0] }),
                    -1
                )
            }
        } catch (_: Exception) {
            vibrateOnce(200)
        }
    }

    private fun vibrateOnce(ms: Long) {
        val vibrator = getVibrator()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createOneShot(ms, VibrationEffect.DEFAULT_AMPLITUDE))
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(ms)
        }
    }

    private fun getVibrator(): Vibrator {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val mgr = activity.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
            mgr.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            activity.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }
    }

    @JavascriptInterface
    fun requestAudioFocus(): Boolean {
        val am = activity.getSystemService(Context.AUDIO_SERVICE) as AudioManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val req = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
                .setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build()
                )
                .build()
            audioFocusRequest = req
            return am.requestAudioFocus(req) == AudioManager.AUDIOFOCUS_REQUEST_GRANTED
        } else {
            @Suppress("DEPRECATION")
            return am.requestAudioFocus(
                null,
                AudioManager.STREAM_MUSIC,
                AudioManager.AUDIOFOCUS_GAIN_TRANSIENT
            ) == AudioManager.AUDIOFOCUS_REQUEST_GRANTED
        }
    }

    @JavascriptInterface
    fun abandonAudioFocus() {
        val am = activity.getSystemService(Context.AUDIO_SERVICE) as AudioManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            audioFocusRequest?.let { am.abandonAudioFocusRequest(it) }
            audioFocusRequest = null
        } else {
            @Suppress("DEPRECATION")
            am.abandonAudioFocus(null)
        }
    }

    @JavascriptInterface
    fun getVolume(): Int {
        val audioManager = activity.getSystemService(Context.AUDIO_SERVICE) as AudioManager
        return audioManager.getStreamVolume(AudioManager.STREAM_MUSIC)
    }

    @JavascriptInterface
    fun setVolume(level: Int) {
        val audioManager = activity.getSystemService(Context.AUDIO_SERVICE) as AudioManager
        val max = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
        val clamped = level.coerceIn(0, max)
        audioManager.setStreamVolume(AudioManager.STREAM_MUSIC, clamped, 0)
    }

    @JavascriptInterface
    fun getMaxVolume(): Int {
        val audioManager = activity.getSystemService(Context.AUDIO_SERVICE) as AudioManager
        return audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
    }
}
