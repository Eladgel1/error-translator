import textwrap

from app.schemas.ai_response import SupportedLanguage
from app.services.analysis.detect_language import detect_language


def test_detect_python_traceback():
    raw = textwrap.dedent(
         """
        Traceback (most recent call last):
          File "/home/user/app/main.py", line 10, in <module>
            run()
        ModuleNotFoundError: No module named 'requests'
        """
    ).strip()

    lang = detect_language(raw)
    assert lang is SupportedLanguage.PYTHON


def test_detect_javascript_node_stack():
    raw = textwrap.dedent(
        """
        TypeError: x is not a function
            at doSomething (/usr/src/app/index.js:12:5)
            at Object.<anonymous> (/usr/src/app/index.js:20:3)
            at Module._compile (node:internal/modules/cjs/loader:1256:14)
        """
    ).strip()

    lang = detect_language(raw)
    assert lang is SupportedLanguage.JAVASCRIPT


def test_detect_java_stacktrace():
    raw = textwrap.dedent(
        """
        Exception in thread "main" java.lang.NullPointerException
            at com.example.Main.main(Main.java:14)
        Caused by: java.lang.IllegalArgumentException: bad argument
            at com.example.Service.run(Service.java:42)
        """
    ).strip()

    lang = detect_language(raw)
    assert lang is SupportedLanguage.JAVA


def test_language_hint_overrides_detection():
    raw = "some random text that looks like nothing special"

    lang = detect_language(raw, language_hint=SupportedLanguage.PYTHON)
    assert lang is SupportedLanguage.PYTHON


def test_unknown_when_no_signals():
    raw = "just some generic error without any language-specific markers"
    lang = detect_language(raw)
    assert lang is SupportedLanguage.UNKNOWN


def test_detect_language_uses_language_hint_when_error_is_ambiguous():
    raw = "ReferenceError: variable is not defined"

    # Ambiguous error → not clearly Python/JS/Java
    # but the hint should force the detection
    lang = detect_language(
        raw,
        language_hint=SupportedLanguage.JAVASCRIPT
    )

    assert lang is SupportedLanguage.JAVASCRIPT
