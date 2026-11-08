from services.validation import (
    check_audio_file,
    extension_of,
    extract_soundcloud_slug,
    guess_mime_type,
    human_size,
    is_soundcloud_url,
    normalize_soundcloud_url,
    safe_title_from_filename,
)

ALLOWED_EXT = frozenset({"mp3", "flac", "wav", "m4a"})
ALLOWED_MIME = frozenset({"audio/mpeg", "audio/flac", "audio/wav", "audio/mp4"})


def test_accepts_common_soundcloud_urls():
    assert is_soundcloud_url("https://soundcloud.com/artist/track")
    assert is_soundcloud_url("soundcloud.com/artist/track")
    assert is_soundcloud_url("https://on.soundcloud.com/abc123")
    assert is_soundcloud_url("https://m.soundcloud.com/artist/track?si=abc")


def test_rejects_non_soundcloud_urls():
    assert not is_soundcloud_url("")
    assert not is_soundcloud_url("https://example.com/artist/track")
    assert not is_soundcloud_url("https://soundcloud.com")
    assert not is_soundcloud_url("javascript:alert(1)")
    assert not is_soundcloud_url("https://soundcloud.com.evil.test/a/b")


def test_normalizes_tracking_parameters():
    cleaned = normalize_soundcloud_url(
        "http://www.soundcloud.com/Artist/Track/?utm_source=x&si=123&ref=abc"
    )
    assert cleaned == "https://www.soundcloud.com/Artist/Track"


def test_slug_is_stable():
    assert (
        extract_soundcloud_slug("https://soundcloud.com/Artist/Track?si=1")
        == "artist/track"
    )


def test_extension_of():
    assert extension_of("song.MP3") == "mp3"
    assert extension_of("folder/My Song.FLAC") == "flac"
    assert extension_of("noextension") == ""
    assert extension_of(None) == ""


def test_check_audio_accepts_valid_file():
    result = check_audio_file(
        "song.mp3",
        "audio/mpeg",
        1024,
        allowed_extensions=ALLOWED_EXT,
        allowed_mime_types=ALLOWED_MIME,
        max_bytes=10 * 1024 * 1024,
    )
    assert result.ok
    assert result.extension == "mp3"


def test_check_audio_rejects_oversized_file():
    result = check_audio_file(
        "song.mp3",
        "audio/mpeg",
        30 * 1024 * 1024,
        allowed_extensions=ALLOWED_EXT,
        allowed_mime_types=ALLOWED_MIME,
        max_bytes=20 * 1024 * 1024,
    )
    assert not result.ok
    assert "20" in result.reason


def test_check_audio_rejects_wrong_extension():
    result = check_audio_file(
        "script.exe",
        "application/octet-stream",
        100,
        allowed_extensions=ALLOWED_EXT,
        allowed_mime_types=ALLOWED_MIME,
        max_bytes=10 * 1024 * 1024,
    )
    assert not result.ok


def test_check_audio_infers_extension_from_mime():
    result = check_audio_file(
        None,
        "audio/mpeg",
        100,
        allowed_extensions=ALLOWED_EXT,
        allowed_mime_types=ALLOWED_MIME,
        max_bytes=10 * 1024 * 1024,
    )
    assert result.ok
    assert result.extension == "mp3"


def test_guess_mime_type():
    assert guess_mime_type("mp3") == "audio/mpeg"
    assert guess_mime_type("flac") == "audio/flac"
    assert guess_mime_type("unknown") == "application/octet-stream"


def test_human_size():
    assert human_size(0) == "—"
    assert human_size(512) == "512 Б"
    assert human_size(1536) == "1.5 КБ"
    assert human_size(5 * 1024 * 1024) == "5.0 МБ"


def test_safe_title_from_filename():
    assert safe_title_from_filename("My_Song_Name.mp3") == "My Song Name"
    assert safe_title_from_filename(None) == "Без названия"
