from services.messages import (
    escape,
    format_duration,
    track_caption,
)


def test_escape_prevents_html_injection():
    assert escape("<script>") == "&lt;script&gt;"
    assert escape(None) == ""


def test_format_duration():
    assert format_duration(None) == "—"
    assert format_duration(0) == "—"
    assert format_duration(59) == "0:59"
    assert format_duration(75) == "1:15"
    assert format_duration(3725) == "1:02:05"


def test_track_caption_contains_metadata():
    caption = track_caption(
        {
            "title": "Night Drive",
            "artist": "MUSE",
            "duration": 245,
            "source": "soundcloud",
            "playback_type": "soundcloud_embed",
        }
    )
    assert "Night Drive" in caption
    assert "MUSE" in caption
    assert "4:05" in caption
    assert "SoundCloud" in caption
    assert "Трек добавлен" in caption


def test_track_caption_escapes_title():
    caption = track_caption(
        {
            "title": "<b>Evil</b>",
            "artist": "Artist",
            "duration": 10,
            "source": "telegram_upload",
            "playback_type": "stored_audio",
        }
    )
    assert "<b>Evil</b>" not in caption
    assert "&lt;b&gt;Evil&lt;/b&gt;" in caption
