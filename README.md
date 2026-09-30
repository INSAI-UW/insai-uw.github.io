# Strona INSAI

Strona Interdyscyplinarnego Koła Naukowego Analiz Strategicznych Sztucznej Inteligencji (INSAI) przy Uniwersytecie Warszawskim, uczelnianej organizacji studenckiej nr 1338.

Wersja 1. Projekt i wykonanie: Aleksander Rej.

## Jak to działa

Strona jest statyczna. Nie ma etapu budowania ani zależności do instalowania. Nie ładuje niczego z zewnętrznych serwerów: biblioteki i kroje są w katalogu `vendor/`.

| Plik albo katalog | Zawartość |
|---|---|
| `index.html` | treść strony, style, znak koła |
| `404.html` | strona błędu |
| `main.js` | sterowanie sceną, nawigacja, maska tekstu |
| `net.js`, `forms.js` | scena trójwymiarowa i jej formacje (od 1081 px szerokości okna) |
| `plates.js`, `rycina-tytulowa.js` | rysunek dla węższych okien i dla przeglądarek bez WebGL |
| `znak.js`, `ink.js` | animacja znaku przy otwarciu strony |
| `assets/` | portrety zarządu |
| `dokumenty/` | regulamin koła (PDF); dokument koła, poza licencją strony |
| `vendor/` | three.js, Lenis i kroje pisma, każdy z licencją |

## Podgląd lokalny

Wystarczy dowolny serwer plików statycznych uruchomiony w katalogu repozytorium, na przykład:

```
python3 -m http.server 8000
```

Potem `http://127.0.0.1:8000/`.

## Dostępność i ruch

Strona respektuje ustawienie systemowe ograniczenia ruchu. Przycisk „Zatrzymaj ruch” wyłącza animacje i zapamiętuje ten wybór w danej przeglądarce. W węższych oknach i bez WebGL strona rysuje lżejszą wersję ilustracji, bez sceny trójwymiarowej.

## Prawa

Prawa do strony opisuje plik `LICENSE.md`. Składniki innych autorów i ich licencje wymienia plik `THIRD-PARTY-NOTICES.md`.

Kontakt: insai@uw.edu.pl
