# Slopless for PulseSync

[![PulseSync Addon](https://img.shields.io/badge/PulseSync-Addon-8B5CF6?style=flat-square&logo=yamusic)](https://github.com/PulseSync) [![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg?style=flat-square)](LICENSE) [![Latest Release](https://img.shields.io/github/v/release/tslyf/slopless-pulsesync?style=flat-square&color=8B5CF6&label=release)](https://github.com/tslyf/slopless-pulsesync/releases/latest) [![API Status](https://img.shields.io/website?url=https%3A%2F%2Fslopless.art%2Fapi%2Fhome&up_message=online&down_message=offline&label=API)](https://slopless.art)

![Slopless Banner](./addon/Assets/banner.png)

> **Примечание:** Это неофициальный нативный порт браузерного расширения [Slopless](https://github.com/alexeyfv/slopless) (оригинальный автор: [@alexeyfv](https://github.com/alexeyfv)), адаптированный специально для работы внутри десктопного клиента Яндекс Музыки — **PulseSync**.

## О проекте

Медиатека Яндекса всё чаще пополняется музыкой, полностью сгенерированной нейросетями. Этот аддон позволяет очистить ваш музыкальный поток от такого контента. Скрипт помечает ИИ-артистов и отдельные ИИ-треки специальными бейджами, а также умеет автоматически пропускать или ставить дизлайк сгенерированным релизам. Работает через API оригинального проекта.

---

## Ручная установка

1. Убедитесь, что у вас установлен десктопный клиент [PulseSync](https://github.com/PulseSync-LLC/PulseSync-client).
2. Скачайте последнюю версию аддона из раздела [Releases](../../releases).
3. Распакуйте архив и поместите папку `slopless` в директорию аддонов PulseSync:
   * **Windows:** `%APPDATA%/PulseSync/addons/`
   * **Linux/macOS:** `~/.config/PulseSync/addons/`
4. Перезапустите клиент и включите аддон в настройках.

---

## Настройки

| Параметр | Описание |
| :--- | :--- |
| **Действие при воспроизведении** | Что делать, если заиграл ИИ-трек: дизлайк, пропуск, ничего не делать или лайк. |
| **Проверять отдельные треки** | Искать сгенерированные треки даже у «чистых» артистов. |
| **Порог «ИИ-шности» артиста** | Какой процент треков артиста должен быть от ИИ, чтобы считать его нейро-артистом (рекомендуется 5%). |
| **Помечать ИИ-артистов / треки** | Включение и отключение визуальных красных меток в интерфейсе Яндекса. |
| **Язык** | Язык бейджей и всплывающих подсказок (Русский / English). |

---

## Скриншоты интерфейса

  **1. Бейджи ИИ-артистов в списках:**
  ![Бейджи в списках](./addon/Assets/screenshot_1.png)

  **2. Маркировка на странице профиля артиста:**
  ![Карточка артиста](./addon/Assets/screenshot_2.png)
  ![Рекомендации](./addon/Assets/screenshot_3.png)

---

## Благодарности

Серверное API и изначальная идея принадлежат автору оригинального проекта:
* [Slopless by alexeyfv](https://github.com/alexeyfv/slopless)

---

## Лицензия

Этот проект распространяется под лицензией GNU GPLv3. Подробности см. в файле [LICENSE](LICENSE). Данные для анализа запрашиваются напрямую с серверов оригинального проекта.