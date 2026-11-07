# GestureTalk Glove

The glove is how a person who cannot speak, because of ALS/MND, stroke, cerebral palsy, a tracheostomy and so on, signs to the GestureTalk app. Five flex sensors and a motion sensor stream hand movement at 50 Hz over Bluetooth. **The app learns the wearer's own signs** from a few examples, then turns them into text and speech.

The glove does no recognition itself. It only measures and streams. This means:
- a person's signs can be taught, improved and backed up without reflashing the glove;
- one glove can be shared by several patients, each with their own profile;
- recognition improves through app updates.

Why personal signs instead of standard sign language? Most people who lose speech through ALS or stroke never learned a sign language, and their hands often can't form textbook handshapes. Gloves that only recognise a fixed alphabet fail them. GestureTalk instead asks: *what movement can this person make reliably?* That movement then becomes "water", "turn me over" or "I love you".

## 1. Parts list (one glove)

| Ref | Part | Qty | Notes | Approx. cost (₹) |
|---|---|---|---|---|
| U1 | **Seeed XIAO ESP32S3** | 1 | BLE 5, USB-C, built-in Li-Po charger, tiny | 900 |
| FLEX1–5 | Flex sensor 2.2" (Spectra Symbol FS-L-0055 or equivalent) | 5 | Use 4.5" for adult index/middle fingers if available | 5 × 350 |
| U2 | MPU-6050 breakout (GY-521) | 1 | Detects thumb up vs down | 150 |
| M1 | 10 mm coin vibration motor, 3 V | 1 | Haptic confirmation | 60 |
| Q1 | 2N2222A NPN transistor (or AO3400 MOSFET) | 1 | Motor driver | 5 |
| D1 | 1N4148 diode | 1 | Flyback protection | 2 |
| R1–R5 | 47 kΩ resistor, 1/4 W | 5 | Flex divider. Tune to roughly the sensor's mid-bend resistance. | 5 |
| R6, R7 | 100 kΩ resistor | 2 | Battery voltage divider | 2 |
| R8 | 1 kΩ resistor | 1 | Transistor base | 1 |
| C1–C6 | 100 nF ceramic capacitor | 6 | ADC noise filtering | 10 |
| BT1 | 3.7 V Li-Po, 400–600 mAh, **with protection circuit**, JST-PH | 1 | Lasts about 10–14 h | 350 |
| SW1 | Mini slide switch | 1 | Power | 10 |
| SW2 | 6 mm tactile button | 1 | Carer button (state is streamed to the app) | 5 |
| — | Stretch glove, cotton/lycra, **latex-free** | 2 | Buy two, so one can be washed while the other is used | 200 |
| — | Perfboard 3 × 4 cm, or the PCB (see §7) | 1 | | 30 |
| — | Silicone-insulated wire 28–30 AWG, 6 colours | ~3 m | Silicone stays flexible | 150 |
| — | Heat-shrink tubing, Kapton tape | — | Strain relief at sensor pins | 50 |
| — | Sew-on fabric channels (or 3 mm elastic + thread) | 5 | Sensors slide inside so they can be removed | 50 |
| — | Velcro wrist strap + small enclosure (3D-printed from `enclosure.scad`, or a 50 × 35 × 15 mm ABS box) | 1 | Electronics pod on the back of the wrist | 100 |

**Total: roughly ₹4,000 (≈ US$50)** per glove.

## 2. Schematic

![schematic](schematic.svg)

Wiring table (XIAO ESP32S3 pad → part):

| XIAO pin | GPIO | Connects to |
|---|---|---|
| D0 | 1 | Thumb divider node (FLEX1 / R1 junction) + C1 to GND |
| D1 | 2 | Index divider node + C2 |
| D2 | 3 | Middle divider node + C3 |
| D3 | 4 | Ring divider node + C4 |
| D8 | 7 | Pinky divider node + C5 |
| D4 | 5 | MPU-6050 SDA |
| D5 | 6 | MPU-6050 SCL |
| D6 | 43 | R8 1 kΩ → Q1 base |
| D7 | 44 | SW2 → GND (internal pull-up) |
| D10 | 9 | Junction of R6 (to BAT+) and R7 (to GND) + C6 |
| 3V3 | — | Top of every flex sensor, MPU VCC, motor + |
| GND | — | R1–R5 bottoms, MPU GND, Q1 emitter, SW2 |
| BAT+ / BAT− pads (underside) | — | Li-Po through SW1 |

Each flex divider is: `3V3 → flex sensor → node → 47 kΩ → GND`. As the finger bends, the sensor's resistance rises and the node voltage falls. The firmware works whichever direction the voltage moves, because calibration records both ends.

Only ADC1 pins (GPIO 1–10) are used for analog readings. ADC2 gives unreliable readings while Bluetooth is on.

## 3. Build workflow

```
 ┌─────────────┐   ┌──────────────┐   ┌─────────────┐   ┌──────────────┐   ┌──────────────┐   ┌────────────┐
 │ 1 Bench-test│ → │ 2 Solder pod │ → │ 3 Flash +   │ → │ 4 Sew glove  │ → │ 5 Calibrate  │ → │ 6 Patient  │
 │  on bread-  │   │  board       │   │  serial     │   │  channels,   │   │  on the      │   │  trial     │
 │  board      │   │              │   │  check      │   │  fit sensors │   │  wearer      │   │  checklist │
 └─────────────┘   └──────────────┘   └─────────────┘   └──────────────┘   └──────────────┘   └────────────┘
```

### Step 1: Breadboard test (≈1 h)
1. Put the XIAO on a breadboard. Wire one flex sensor and its 47 kΩ resistor to D1.
2. Flash the firmware (step 3). Open Serial Monitor at 115200 baud.
3. Bend the sensor. The voltage must change by at least **300 mV** between straight and bent. If it doesn't, change the 47 kΩ to a value close to the sensor's resistance at half bend. Measure that with a multimeter.
4. Add the other four sensors, the MPU-6050 and the motor, testing after each one.

### Step 2: Solder the electronics pod (≈2 h)
1. Lay out the five dividers, C1–C6, R6/R7 and the motor driver on a 3 × 4 cm perfboard. Mount the XIAO on header pins so it can be replaced.
2. Bring out a 7-pin connector (3V3, GND and the 5 finger signals; a JST-SH or a 2.54 mm header) so the glove can be detached for washing.
3. Solder the battery to the BAT+/BAT− pads under the XIAO, with SW1 in the positive lead. Insulate the pads with Kapton.
4. Hot-glue the MPU-6050 flat inside the lid, **Y-axis arrow pointing toward the thumb**.
5. Put everything in the enclosure. Leave holes for USB-C, SW1 and SW2. Glue the motor to the inside of the floor so the wearer feels it against the wrist.

### Step 3: Flash the firmware (≈15 min)
1. Install the **Arduino IDE 2**. Under *Boards Manager*, install **esp32 by Espressif (3.x)**.
2. Select board **XIAO_ESP32S3** and the right port.
3. Open `firmware/gesturetalk_glove/gesturetalk_glove.ino` and upload. No extra libraries are needed.

   Or use the command line:
   ```bash
   arduino-cli compile --fqbn esp32:esp32:XIAO_ESP32S3 firmware/gesturetalk_glove
   ```
   ```bash
   arduino-cli upload --fqbn esp32:esp32:XIAO_ESP32S3 -p /dev/ttyACM0 firmware/gesturetalk_glove
   ```
4. At power-on the glove buzzes **once** if all five sensors read normally, or **three times** if one is unplugged or broken (Serial Monitor names which one). Below 15% battery it gives two long buzzes every 5 minutes.
5. Open Serial Monitor at 115200 baud. You should see `IMU ok`, then a line of `flex … acc …` values twice a second. Bend each finger: its number must change by at least 300.

### Step 4: Make the glove (≈2 h)
1. Sew a fabric channel (a pocket about 8 mm wide) along the **back** of each finger, from the knuckle to just before the fingertip. Leave the knuckle end open.
2. Slide each flex sensor in **printed side away from the finger**, with the pins at the knuckle end. The sensor must bend over the middle finger joint.
3. Strain relief is the most common failure point. Heat-shrink the sensor pins, then tape the wire to the glove 1 cm behind the pins so pulling never reaches the sensor.
4. Run the wires along the back of the hand to the pod connector. Leave slack loops at the wrist.
5. Fix the pod to a Velcro wrist strap, not the glove, so the glove can be washed. Mount the motion sensor flat on the back of the hand.

### Step 5: Set up in the app (≈5 min per person)
1. Put the glove on, switch it on, and tap **Connect glove** in the app.
2. Go to **Signs → Calibrate glove**. Relax the hand for 3 s, then bend the fingers as far as is comfortable for 3 s. Fingers that don't move are detected and ignored.
3. Tap **Teach a sign**. Start with **Yes**, **No** and **Help**, then add what this person needs most. Do each sign 4 times. The app warns if an attempt is inconsistent, or too similar to another sign.
4. Check the self-test score on each sign. Anything under 80% needs more practice or a more distinct movement.
5. Use **Settings → People → Back up** to save the profile as a file.

### Step 6: Bedside checklist before relying on it
- [ ] Each gesture in the table above fires reliably 5 out of 5 times, without false triggers during 2 minutes of rest and normal movement.
- [ ] HELP alarm is loud enough to hear from the nurses' station / doorway.
- [ ] Carer knows how to acknowledge the alarm, recharge (USB-C, about 1.5 h) and recalibrate.
- [ ] Battery shows in the app, and the app warns below 20%.
- [ ] Skin checked after 1 hour of wear (pressure marks, sweating). Remove the glove for at least 15 min every 2 hours.
- [ ] Touch-screen and yes/no card backups are within reach.

## 4. Safety and hygiene

- **This is not a medical device or a nurse-call system.** Use it alongside the hospital's call bell, never instead of it.
- Use a Li-Po **with a protection circuit**. Do not charge it unattended or under bedding. Stop using any battery that is swollen.
- Remove the glove before MRI, defibrillation, or procedures with electrosurgery.
- Do not use on broken skin, IV/cannula sites, or a limb with an arterial line.
- The glove is personal to one patient. Between uses, remove the sensors, wash the glove at 60 °C, and wipe the pod with 70% alcohol. Never immerse the pod.
- Choose latex-free materials. Check for nickel or adhesive allergies.

## 5. Troubleshooting

| Symptom | Fix |
|---|---|
| App can't find the glove | It only works in Chrome or Edge. Turn on Bluetooth and location (Android needs it for BLE). Switch the glove off and on again. |
| Sensor bars don't move | Check Serial Monitor first. If the values change there, recalibrate in the app. If not, look for a broken wire or a cracked sensor at the pins. |
| Signs trigger while resting | Recalibrate with the hand truly relaxed. Set **Settings → Sign recognition** to stricter. |
| A sign is often missed | Add practice (4 more attempts), or set recognition to more lenient. Make it more different from the sign it gets confused with (shown on the Signs screen). |
| Two signs get mixed up | Change one of them: different fingers, different hand orientation, or add a wrist movement. |
| Readings jump when Bluetooth connects | A flex sensor is on an ADC2 pin, or a 100 nF capacitor is missing. |

## 6. Protocol (for developers)

BLE service `6e7a0001-5a1f-4c2b-9d3e-7f1a2b3c4d5e`:

| Characteristic | UUID | Properties | Payload |
|---|---|---|---|
| Frame | `6e7a0002-…` | notify, 50 Hz | 20 bytes LE: `uint16[5]` flex mV · `int16[3]` accel milli-g · `int8[3]` gyro °/s ÷ 8 · `uint8` (bit 7 button, bits 0–6 sequence) |
| Battery | `6e7a0003-…` | read, notify | UTF-8 integer 0–100 |
| Command | `6e7a0004-…` | write | `BUZZ <ms>`: vibrate (the app sends this on every recognised sign) |

The app side lives in `app/lib/sensors.ts` (frame format, features), `app/lib/recognizer.ts` (segmentation and matching) and `app/hooks/useGlove.tsx` (Bluetooth). Any hardware that streams this frame format works with the app, for example a different microcontroller or a glove with fewer sensors.

### Testing the firmware without hardware

```bash
make -C hardware/glove/firmware/test
```

This runs the unit tests for `glove_frame.h` (frame packing, unit conversions, battery %, command parsing, fault detection) and regenerates `vectors.json`, which the app's tests decode byte-for-byte. It also compiles the whole sketch with warnings-as-errors against stand-in Arduino/BLE headers. Those headers are a stand-in, so the real ESP32 build in Step 3 is still required.

## 7. Next revision ideas
- Custom 2-layer PCB (KiCad) to replace the perfboard.
- Fabric (Velostat / conductive-thread) bend sensors to bring the cost below ₹1,000.
- Second glove for two-handed signs.
- Deep sleep after 10 minutes without movement.
