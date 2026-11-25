"use strict";

function initRegistration() {
  const form = document.getElementById("registration-form");
  if (!form) return;

  const password = document.getElementById("password");
  const toggle = document.getElementById("toggle-password");
  const status = document.getElementById("form-status");
  const pet = document.getElementById("pixel");
  const line = document.getElementById("pet-line");
  const fields = [...form.querySelectorAll("input, select")];
  const layout = matchMedia("(max-width: 770px)");
  let passwordWasLongEnough = false;
  const messages = {
    name: "Введіть ім’я щонайменше з двох символів.",
    email: "Вкажіть адресу у форматі olena@example.test.",
    password: "Введіть щонайменше 8 символів.",
    country: "Оберіть країну зі списку.",
  };

  function react(mood, caption, gesture) {
    if (pet.dataset.mood !== mood) pet.dataset.mood = mood;
    if (line.textContent !== caption) line.textContent = caption;
    if (gesture) pet.dataset.gesture = gesture;
    else if (pet.dataset.gesture) delete pet.dataset.gesture;
  }

  function lookAt(field) {
    const stacked = layout.matches;
    const progress = field.tagName === "INPUT" ? Math.min(1, (field.selectionEnd ?? field.value.length) / 18) : 0;
    const horizontal = stacked ? (progress - .5) * 8 : 5 + progress * 5;
    const vertical = stacked ? 8 : field.id === "name" ? -2 : field.id === "email" ? 3 : 7;
    pet.style.setProperty("--look-x", `${horizontal}px`);
    pet.style.setProperty("--look-y", `${vertical}px`);
    pet.style.setProperty("--head-x", stacked ? "0px" : "6px");
    pet.style.setProperty("--head-y", stacked ? "6px" : "0px");
    pet.style.setProperty("--head-tilt", stacked ? "0deg" : `${6 + progress * 5}deg`);
  }

  function privatePose(field) {
    const hide = field === password || field === toggle;
    pet.dataset.private = String(hide);
    return hide;
  }

  function watch(field) {
    if (privatePose(field)) {
      react("hide", "Я прикриваю очі.");
    } else if (fields.includes(field)) {
      lookAt(field);
      react("watch", field.id === "country" ? "Обираємо країну." : "Я стежу за рядком.");
    } else {
      react("idle", "Я поруч.");
    }
  }

  function setPasswordVisible(visible) {
    password.type = visible ? "text" : "password";
    toggle.textContent = visible ? "Приховати" : "Показати";
  }

  function checkField(field) {
    let valid = field.validity.valid;
    if (field.id === "name") valid = field.value.trim().length >= 2;
    if (field === password) valid = field.value.length >= 8;
    const feedback = document.getElementById(field.id + "-feedback");
    field.setAttribute("aria-invalid", String(!valid));
    feedback.textContent = valid ? "" : messages[field.id];

    return valid;
  }

  toggle.addEventListener("click", () => {
    setPasswordVisible(password.type === "password");
    privatePose(toggle);
    react("hide", "Я все ще не підглядаю.", "reveal");
  });

  form.addEventListener("focusin", (event) => watch(event.target));
  form.addEventListener("focusout", (event) => {
    if (!form.contains(event.relatedTarget)) {
      privatePose(null);
      if (pet.dataset.mood !== "success") react("idle", "Я поруч.");
    }
  });

  for (const field of fields) {
    document.getElementById(field.id + "-feedback").dataset.hint = messages[field.id];
    if (field !== password) {
      const followCaret = () => {
        if (field === document.activeElement && pet.dataset.mood === "watch") lookAt(field);
      };
      for (const event of ["keyup", "click", "select"]) field.addEventListener(event, followCaret);
    }
    field.addEventListener("input", () => {
      status.textContent = "";
      const hadError = field.getAttribute("aria-invalid") === "true";
      if (hadError && !checkField(field)) {
        if (field !== password) lookAt(field);
        return;
      }
      watch(field);
      if (hadError) {
        if (field === password) passwordWasLongEnough = true;
        react(field === password ? "hide" : "watch", "Вийшло! Це поле вже в порядку.", "perk");
      } else if (field.id === "country" && field.value) {
        react("watch", "Країну обрано!", "nod");
      } else if (field === password && field.value.length < 8) {
        passwordWasLongEnough = false;
      } else if (field === password && !passwordWasLongEnough) {
        passwordWasLongEnough = true;
        react("hide", "Вісім символів є!", "perk");
      }
    });
  }

  layout.addEventListener("change", () => {
    const field = document.activeElement;
    if (fields.includes(field) && field !== password) lookAt(field);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const invalid = fields.filter((field) => !checkField(field));
    if (invalid.length) {
      const field = invalid[0];
      field.focus();
      if (!privatePose(field)) lookAt(field);
      react("error", "Ой, під полем є підказка.");
      status.textContent = "Перевірте виділені поля.";
      return;
    }

    form.reset();
    passwordWasLongEnough = false;
    setPasswordVisible(false);
    privatePose(document.activeElement);
    react("success", "Усе правильно!");
    status.textContent = "Форму перевірено. Поля очищено.";
  });

  form.noValidate = true;
  document.getElementById("submit-form").disabled = false;
}

initRegistration();

const signalLabels = {
  videoStarted: "Відео запущено",
  audioStarted: "Аудіо запущено",
  copied: "Текст скопійовано",
  located: "Координати отримано",
  locationDenied: "Дозвіл на геолокацію відхилено",
  notificationDenied: "Дозвіл на сповіщення відхилено",
  notificationDismissed: "Дозвіл на сповіщення не надано",
  notificationShown: "Браузер показав сповіщення",
  notificationQueued: "Сповіщення передано системі",
  liftArrived: "Ліфт прибув на перший поверх",
};

function addSignal(key) {
  const log = document.getElementById("signal-log");
  if (!log || !Object.hasOwn(signalLabels, key)) return;

  // Журнал містить лише фіксовані підписи. Введені або отримані дані сюди не потрапляють.
  const entry = document.createElement("li");
  entry.textContent = signalLabels[key];
  log.prepend(entry);
  if (log.children.length > 4) log.lastElementChild.remove();
  document.getElementById("log-empty").hidden = true;
}

function flashEffect(effect) {
  effect.classList.remove("is-active");
  // Прочитати розмір, щоб CSS міг запустити ту саму анімацію повторно.
  void effect.offsetWidth;
  effect.classList.add("is-active");
}

function initInterfaceSound() {
  const toggle = document.getElementById("sound-toggle");
  if (!toggle) return;

  const label = document.getElementById("sound-state");
  const status = document.getElementById("sound-status");
  const cue = document.getElementById("interface-cue");
  cue.volume = 0.45;
  toggle.disabled = false;

  toggle.addEventListener("click", () => {
    const enabled = toggle.getAttribute("aria-pressed") === "false";
    toggle.setAttribute("aria-pressed", String(enabled));
    label.textContent = enabled ? "Увімкнено" : "Вимкнено";
    status.textContent = "";
    if (!enabled) cue.pause();
  });

  return async function playCopyCue() {
    if (toggle.getAttribute("aria-pressed") !== "true") return;

    try {
      cue.currentTime = 0;
      await cue.play();
      status.textContent = "";
    } catch (error) {
      if (error.name !== "AbortError") status.textContent = "Браузеру не вдалося відтворити сигнал.";
    }
  };
}

function initPlayer(player) {
  const media = player.querySelector("video, audio");
  const play = player.querySelector("[data-play]");
  const pause = player.querySelector("[data-pause]");
  const mute = player.querySelector("[data-mute]");
  const status = player.querySelector("[data-player-status]");
  let playbackFailed = false;
  let isPlaying = false;
  let loggedRun = false;

  function updatePlayerStatus() {
    const silent = media.muted || media.volume === 0;
    mute.textContent = silent ? "Unmute" : "Mute";
    player.classList.toggle("is-playing", isPlaying);
    let playback = "Готове до відтворення.";
    if (media.error) {
      playback = "Медіафайл не завантажився.";
    } else if (playbackFailed) {
      playback = "Не вдалося почати відтворення.";
    } else if (media.ended) {
      playback = "Відтворення завершено.";
    } else if (isPlaying) {
      playback = "Відтворюється.";
    } else if (!media.paused) {
      playback = "Медіа завантажується…";
    } else if (media.currentTime > 0) {
      playback = "На паузі.";
    }
    const message = playback + (silent ? " Звук вимкнено." : " Звук увімкнено.");
    if (status.textContent !== message) status.textContent = message;
  }

  play.addEventListener("click", async () => {
    playbackFailed = false;
    try {
      await media.play();
    } catch (error) {
      // Пауза може перервати play(), який ще очікує, без помилки медіа.
      playbackFailed = error.name !== "AbortError" && media.paused;
    }
    updatePlayerStatus();
  });

  pause.addEventListener("click", () => media.pause());

  mute.addEventListener("click", () => {
    const silent = media.muted || media.volume === 0;
    if (silent && media.volume === 0) media.volume = 0.7;
    media.muted = !silent;
  });

  // Події медіа спрацьовують і для штатних кнопок браузера.
  media.addEventListener("playing", () => {
    if (media.paused) return;
    isPlaying = true;
    playbackFailed = false;
    player.classList.add("has-played");
    if (!loggedRun) {
      addSignal(player.dataset.player === "video" ? "videoStarted" : "audioStarted");
      loggedRun = true;
    }
    updatePlayerStatus();
  });

  for (const event of ["pause", "ended", "error"]) {
    media.addEventListener(event, () => {
      isPlaying = false;
      loggedRun = false;
      updatePlayerStatus();
    });
  }

  media.addEventListener("waiting", () => {
    isPlaying = false;
    updatePlayerStatus();
  });
  media.addEventListener("play", updatePlayerStatus);
  media.addEventListener("volumechange", updatePlayerStatus);
  updatePlayerStatus();
}

function initClipboard(playCopyCue) {
  const button = document.getElementById("copy-text-button");
  if (!button) return;

  const input = document.getElementById("copy-text");
  const status = document.getElementById("copy-status");
  const effect = document.getElementById("copy-effect");

  button.addEventListener("click", async () => {
    if (button.hasAttribute("aria-disabled")) return;
    effect.classList.remove("is-active");
    if (!window.isSecureContext || !navigator.clipboard?.writeText) {
      status.textContent = "Буфер обміну недоступний. Спробуй localhost або HTTPS.";
      return;
    }
    if (!input.value) {
      status.textContent = "Введи текст для копіювання.";
      return;
    }

    button.setAttribute("aria-disabled", "true");
    try {
      await navigator.clipboard.writeText(input.value);
      status.textContent = "Текст скопійовано.";
      addSignal("copied");
      flashEffect(effect);
      playCopyCue?.();
    } catch (error) {
      status.textContent = error.name === "NotAllowedError"
        ? "Браузер не дозволив копіювання. Спробуй localhost або HTTPS."
        : "Не вдалося скопіювати текст.";
    } finally {
      button.removeAttribute("aria-disabled");
    }
  });

  input.addEventListener("input", () => {
    status.textContent = "Чекає на дію.";
    effect.classList.remove("is-active");
  });
}

function initGeolocation() {
  const button = document.getElementById("geo-button");
  if (!button) return;

  const status = document.getElementById("geo-status");
  const effect = document.getElementById("geo-effect");

  function showPosition(position) {
    const { latitude, longitude } = position.coords;
    status.textContent = `Широта: ${latitude.toFixed(5)}°, довгота: ${longitude.toFixed(5)}°.`;
    button.removeAttribute("aria-disabled");
    addSignal("located");
    flashEffect(effect);
  }

  function showLocationError(error) {
    const messages = {
      1: "Доступ до геолокації заборонено. Перевір дозволи сайту й системи.",
      2: "Не вдалося визначити місцеположення.",
      3: "Час очікування вичерпано. Спробуй ще раз.",
    };
    status.textContent = messages[error.code] || "Помилка геолокації.";
    button.removeAttribute("aria-disabled");
    if (error.code === 1) addSignal("locationDenied");
  }

  button.addEventListener("click", () => {
    if (button.hasAttribute("aria-disabled")) return;
    effect.classList.remove("is-active");
    if (!window.isSecureContext || !navigator.geolocation) {
      status.textContent = "Геолокація недоступна. Спробуй localhost або HTTPS.";
      return;
    }

    status.textContent = "Очікуємо на дозвіл і координати…";
    button.setAttribute("aria-disabled", "true");
    navigator.geolocation.getCurrentPosition(showPosition, showLocationError, { timeout: 10000 });
  });
}

async function notificationWorker() {
  // Мобільні браузери можуть підтримувати сповіщення лише через service worker.
  const registration = await navigator.serviceWorker.register("./notification-worker.js");
  if (registration.active) return registration;

  let timer;
  try {
    return await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("Worker timeout")), 5000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

function showDesktopNotification(title, options) {
  return new Promise((resolve, reject) => {
    const notification = new Notification(title, options);
    const timeout = setTimeout(() => resolve(false), 3500);
    notification.addEventListener("show", () => {
      clearTimeout(timeout);
      resolve(true);
    }, { once: true });
    notification.addEventListener("error", () => {
      clearTimeout(timeout);
      reject(new Error("Notification unavailable"));
    }, { once: true });
  });
}

function initNotifications() {
  const button = document.getElementById("notify-button");
  if (!button) return;

  const pill = document.getElementById("notify-permission");
  const status = document.getElementById("notify-status");
  const localFile = location.protocol === "file:";
  const canNotify = !localFile && window.isSecureContext &&
    typeof window.Notification?.requestPermission === "function";
  const permissions = {
    default: "Дозвіл ще не надано",
    denied: "Дозвіл заблоковано",
    granted: "Дозвіл надано",
  };
  const refreshPermission = () => {
    if (!canNotify) {
      pill.textContent = "Системні сповіщення недоступні";
      return;
    }
    pill.textContent = permissions[Notification.permission];
  };

  document.getElementById("api-context").hidden = !localFile && window.isSecureContext;
  refreshPermission();
  if (canNotify) {
    window.addEventListener("focus", refreshPermission);
    navigator.permissions?.query({ name: "notifications" })
      .then(permission => permission.addEventListener("change", refreshPermission))
      .catch(() => {});
  }

  button.addEventListener("click", async () => {
    if (button.hasAttribute("aria-disabled")) return;
    if (!canNotify) {
      status.textContent = localFile || !window.isSecureContext
        ? "Для системного сповіщення відкрий сайт через localhost або HTTPS."
        : "Цей браузер не підтримує системні сповіщення.";
      return;
    }

    button.setAttribute("aria-disabled", "true");
    status.textContent = "Перевіряємо дозвіл…";
    try {
      let permission = Notification.permission;
      if (permission === "default") permission = await Notification.requestPermission();
      pill.textContent = permissions[permission];
      if (permission !== "granted") {
        status.textContent = permission === "denied"
          ? "Дозволь сповіщення в налаштуваннях сайту, щоб спробувати знову."
          : "Запит закрито. Щоб надіслати сповіщення, надай дозвіл.";
        addSignal(permission === "denied" ? "notificationDenied" : "notificationDismissed");
        return;
      }

      const title = "Повідомлення з Вебмайстерні";
      const options = {
        body: "Вітаємо! Системні сповіщення для цього сайту дозволено.",
        tag: "web-workshop-demo",
      };
      status.textContent = "Очікуємо на відповідь браузера…";

      let shown;
      try {
        shown = await showDesktopNotification(title, options);
      } catch {
        if (!navigator.serviceWorker) throw new Error("Notifications unavailable");
        const registration = await notificationWorker();
        await registration.showNotification(title, options);
        status.textContent = "Запит передано системі. Перевір центр сповіщень.";
        addSignal("notificationQueued");
        return;
      }
      if (shown) {
        status.textContent = "Браузер підтвердив показ системного сповіщення.";
        addSignal("notificationShown");
      } else {
        status.textContent = "Браузер не підтвердив показ. Перевір центр сповіщень.";
      }
    } catch {
      status.textContent = "Не вдалося надіслати сповіщення. Перевір дозволи браузера й системи.";
      refreshPermission();
    } finally {
      button.removeAttribute("aria-disabled");
    }
  });
}

const playCopyCue = initInterfaceSound();

document.querySelectorAll("[data-player]").forEach(initPlayer);
initClipboard(playCopyCue);
initGeolocation();
initNotifications();

function initWebLab() {
  const panel = document.getElementById("sample");
  if (!panel) return;

  const layers = document.querySelectorAll(".switches [data-step]");
  const call = document.getElementById("sample-action");
  const display = document.getElementById("lift-floor");
  const status = document.getElementById("sample-result");
  const explanation = document.getElementById("lesson-explain");
  const captions = {
    html: "HTML додає номер поверху й кнопку виклику.",
    css: "Притримай кнопку: вона підсвітиться, а поверх залишиться тим самим.",
    js: "Обробник підключено. Натисни «Викликати», щоб кабіна спустилася.",
  };
  let floor = 7;
  let timer;

  function showFloor(number) {
    floor = number;
    display.textContent = String(number);
    panel.style.setProperty("--travel", (7 - floor) * 13 + "px");
  }

  function resetLift() {
    clearInterval(timer);
    showFloor(7);
    panel.classList.remove("moving", "arrived");
    call.removeAttribute("aria-disabled");
    call.textContent = "Викликати";
    status.textContent = "";
  }

  function arrive() {
    clearInterval(timer);
    showFloor(1);
    panel.classList.remove("moving");
    panel.classList.add("arrived");
    call.removeAttribute("aria-disabled");
    call.textContent = "Повернути на сьомий";
    status.textContent = "Поверх 1. Двері відчинено.";
    addSignal("liftArrived");
  }

  function callLift() {
    if (panel.classList.contains("moving")) return;
    if (floor === 1) {
      resetLift();
      return;
    }
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      arrive();
      return;
    }
    panel.classList.add("moving");
    call.setAttribute("aria-disabled", "true");
    status.textContent = "Кабіна їде.";
    showFloor(6);
    timer = setInterval(() => {
      if (floor === 1) arrive();
      else showFloor(floor - 1);
    }, 450);
  }

  for (const layer of layers) {
    layer.addEventListener("click", () => {
      const step = layer.dataset.step;
      if (step === panel.dataset.step) return;
      resetLift();
      panel.dataset.step = step;
      explanation.textContent = captions[step];
      for (const item of layers) item.setAttribute("aria-pressed", String(item === layer));
      call.removeEventListener("click", callLift);
      if (step === "js") call.addEventListener("click", callLift);
    });
  }
}

initWebLab();
