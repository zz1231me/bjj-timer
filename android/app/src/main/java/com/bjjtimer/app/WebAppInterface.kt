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

    private companion object {
        const val PREF_NAME = "bjj_timer_prefs"
        const val KEY_ORIGINAL_VOLUME = "original_music_volume"
    }

    private var audioFocusRequest: AudioFocusRequest? = null
    private var musicVolumePercent: Int = 100
    private var originalMusicVolume: Int = -1

    @JavascriptInterface
    fun keepScreenOn(on: Boolean) {
        activity.runOnUiThread {
            if (on) {
                activity.window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                val params = activity.window.attributes
                if (params.screenBrightness == 0f) {
                    params.screenBrightness = WindowManager.LayoutParams.BRIGHTNESS_OVERRIDE_NONE
                    activity.window.attributes = params
                }
            } else {
                activity.window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            }
        }
    }

    @JavascriptInterface
    fun screenOff() {
        activity.runOnUiThread {
            activity.window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            val params = activity.window.attributes
            params.screenBrightness = 0f
            activity.window.attributes = params
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
    fun setMusicVolumePercent(percent: Int) {
        musicVolumePercent = percent.coerceIn(0, 100)
        applyMusicVolume()
    }

    fun applyMusicVolume() {
        val am = activity.getSystemService(Context.AUDIO_SERVICE) as AudioManager
        val prefs = activity.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
        if (originalMusicVolume < 0) {
            val saved = prefs.getInt(KEY_ORIGINAL_VOLUME, -1)
            if (saved >= 0) {
                originalMusicVolume = saved
            } else {
                originalMusicVolume = am.getStreamVolume(AudioManager.STREAM_MUSIC)
            }
            prefs.edit().putInt(KEY_ORIGINAL_VOLUME, originalMusicVolume).apply()
        }
        if (musicVolumePercent < 100) {
            val reduced = Math.max(0, originalMusicVolume * musicVolumePercent / 100)
            am.setStreamVolume(AudioManager.STREAM_MUSIC, reduced, 0)
        }
    }

    fun restoreMusicVolume() {
        if (originalMusicVolume >= 0) {
            val am = activity.getSystemService(Context.AUDIO_SERVICE) as AudioManager
            am.setStreamVolume(AudioManager.STREAM_MUSIC, originalMusicVolume, 0)
            originalMusicVolume = -1
            activity.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
                .edit().remove(KEY_ORIGINAL_VOLUME).apply()
        }
    }

    @JavascriptInterface
    fun boostForBell() {
        if (originalMusicVolume >= 0 && musicVolumePercent < 100) {
            val am = activity.getSystemService(Context.AUDIO_SERVICE) as AudioManager
            am.setStreamVolume(AudioManager.STREAM_MUSIC, originalMusicVolume, 0)
        }
    }

    @JavascriptInterface
    fun reduceMusicAfterBell() {
        if (originalMusicVolume >= 0 && musicVolumePercent < 100) {
            val am = activity.getSystemService(Context.AUDIO_SERVICE) as AudioManager
            val reduced = Math.max(0, originalMusicVolume * musicVolumePercent / 100)
            am.setStreamVolume(AudioManager.STREAM_MUSIC, reduced, 0)
        }
    }

    @JavascriptInterface
    fun requestAudioFocus(): Boolean {
        val am = activity.getSystemService(Context.AUDIO_SERVICE) as AudioManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val req = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK)
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
                AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK
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
