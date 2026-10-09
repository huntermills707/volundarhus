---
title: "Building a Backyard Weather Station (So Far)"
date: 2026-10-09
draft: false
author: "Hunter Mills"
tags: []
categories: ["homelab", "projects"]
description: "Getting back into embedded systems with a SparkFun MicroMod weather kit, a Raspberry Pi, some no-name Amazon parts, and a more agentic workflow with Linear and CodeRabbit."
---

I haven't done embedded work in years. Most of my time goes to clinical data, models, and the occasional homelab rabbit hole. This project started as an excuse to get back to hardware: a weather station in the backyard, reporting to a Raspberry Pi, with a dashboard I can check from my phone.

It's live now at **[weather.volundarhus.com](https://weather.volundarhus.com)**, and the code is on **[GitHub](https://github.com/huntermills707/diy-weather-station)**. It isn't finished, but it's far enough along to write up.

## The hardware

The core is SparkFun's weather kit: a **MicroMod ESP32** on the **MicroMod Weather Carrier Board**, with the **Weather Meter Kit** (anemometer, wind vane, tipping-bucket rain gauge) and the carrier's onboard **BME280** for temperature, humidity, and pressure. I'm pleased with it. The carrier takes the meter kit's RJ11 jacks directly, the I2C sensors are already on the board, and SparkFun's libraries and calibration constants are a good starting point.

Power is a solar panel charging a battery, and most of that side came from "no name," cheap Amazon listings. I got lucky. Everything showed up working, the charger does its job, and so far the battery has stayed topped up through early-fall days. WiFi reaches the yard without trouble too, which I'd half expected to be the first wall I hit.

The server is a Raspberry Pi on the LAN running:

- a small **FastAPI** ingest service the ESP32 POSTs a reading to every five minutes,
- **SQLite** for storage, with nightly on-Pi backups,
- **Grafana** for poking at the data,
- a read API and a lightweight, mobile-friendly dashboard,
- **ntfy** for alerts (station offline, freeze warnings, failed backups),
- a **Cloudflare Tunnel** that publishes a read-only copy of the dashboard, so nothing on my network is exposed and no ports are forwarded.

On the firmware side, the ESP32 keeps a bounded upload queue so a WiFi drop or a Pi reboot doesn't lose readings, plus a watchdog to recover when something hangs. There are also data-quality flags on the server for out-of-range and stuck sensors.

## Getting reacquainted with embedded

A lot came back quickly. Some lessons I had to learn again the hard way:

- **Trust the board variant's pin map, not the hookup guide.** The example sketch for the carrier listed a different GPIO for the anemometer than the actual `esp32micromod` variant. That cost me a whole spin test.
- **Opening the serial port resets the board.** pyserial asserts DTR/RTS on open, and the auto-reset circuit reboots the ESP32. My capture scripts kept zeroing their counters until I figured that out.
- **The wind vane is a resistor ladder read by an ADC,** and some neighboring directions are only a couple dozen counts apart. I calibrated the lookup table to this unit with a full-revolution sweep instead of relying on the published values.

Mostly I stuck with SparkFun's defaults and kept the firmware simple. It's a weather station, not a flight computer.

## A more agentic workflow

The other half of this project was an experiment in how the work got done. I wanted to see how far I could get with agents doing most of the typing while I set direction, reviewed, and did anything that required hands.

- **[Linear](https://linear.app)** held the plan. Work was broken into milestones (M1 bench bring-up, M2 data pipeline, M3 dashboard, M4 reliability, then the public dashboard), and each one into issues with acceptance criteria.
- **Claude Code** and **Kimi** did most of the implementation: firmware, the FastAPI service, the dashboard, systemd units, docs. They worked issue by issue, and each one ended as a pull request.
- **[CodeRabbit](https://www.coderabbit.ai)** reviewed those PRs, and I reviewed them as well before merging.

It went better than I expected. From the first commit in late August to a public dashboard in early October, it moved through four milestones, with CI (PlatformIO build, static analysis, clang-format, Python linting and tests) and architecture decision records along the way. Having an issue tracker with real acceptance criteria made a bigger difference than I thought it would. The agents did their best work when "done" was written down, and CodeRabbit caught a few things that would have slipped past me and the agents both.

The part that stayed mine was the physical world: spinning the anemometer, tipping the rain bucket, breathing on the BME280 to watch the humidity climb, and walking around the yard with a laptop. An agent can write the firmware, but it can't tell you the bucket oscillates when you shove it by hand, or stand outside and watch the wind vane hunt between directions.

## What isn't working: the thermometer

The biggest problem right now is temperature. The BME280 sits on the carrier board, a few centimeters from the battery charger, and the charger gets warm. In the sun, the temperature reading runs well above the real air temperature. It's the classic weather-station mistake, and I walked straight into it.

The fix isn't obvious. The usual answer is a radiation shield. But the carrier board isn't weatherproof, so it needs an enclosure anyway, and putting the whole board inside a shield brings the charger with it. I'd also rather not end up with a "one part, one box" setup, with a separate enclosure for every component and cables running everywhere.

## Next steps

- **Moving the sensors off the control board.** I'm looking at adding an **[Adafruit BME680](https://www.adafruit.com/product/3660)** (temperature, humidity, pressure, and gas) on a STEMMA QT / Qwiic cable. That would let the environmental sensing sit in a proper radiation shield, away from the ESP32 and the charging circuit, while the control box stays sealed.
- **Air quality.** An **[Adafruit PMSA003I](https://www.adafruit.com/product/4632)** particulate sensor, also STEMMA QT / Qwiic, so it plugs into the same I2C chain. During fire season in Sonoma County, PM2.5 is the number I check most.
- **Finding a permanent site.** I need a spot with plenty of sun for the panel, no wind obstructions for the anemometer, and still within WiFi range. Those three pull in different directions in my yard.
- **Low-power modes.** Solar has kept up through early fall, but winter means shorter days and more clouds. I'll probably need deep sleep between readings or a lower duty cycle on the radio to make it through.
- **Glamour shots.** Once it's mounted and looks presentable, I'll take real photos. For now it looks like a science fair project, and I'd rather not document that.

More to come once it's on a pole.
