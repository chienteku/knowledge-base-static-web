# `embedded-hal`

> **Level 17 — Embedded & Systems Programming**
> The universal, trait-based hardware abstraction interface for embedded Rust — defining standard, portable traits for common microcontroller peripherals (`OutputPin`, `InputPin`, `SpiBus`, `I2c`, `Delay`) to enable platform-agnostic driver crates.

---

## 1. Prerequisites


- [HAL (Hardware Abstraction Layer)](hal.md) — Vendor HALs implement `embedded-hal` traits.
- [Trait](../level_04/trait.md) — Interface trait contracts driving portable embedded code.

---

## 2. Term Category



**Rust Embedded Abstraction (hardware abstraction layer traits)**: `embedded-hal` is the unifying trait library for the Rust embedded ecosystem. It defines shared Rust traits for hardware peripherals without implementing any vendor-specific code. By building external sensor/display drivers (e.g. OLED screen drivers, accelerometer drivers, temperature sensors) against `embedded-hal` traits, a single driver crate works seamlessly across ARM, RISC-V, ESP32, and AVR microcontrollers!



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In traditional embedded development, every accelerometer or OLED display driver is tightly coupled to a specific microcontroller vendor's SDK (e.g. STM32 HAL vs Microchip ASF vs ESP-IDF). Porting an OLED screen driver from STM32 to ESP32 requires rewriting all SPI/I2C communication calls.

`embedded-hal` solves this with **Portable Driver Traits**:
- Display driver accepts any type implementing `embedded_hal::spi::SpiBus`.
- Sensor driver accepts any type implementing `embedded_hal::i2c::I2c`.
- Swapping the underlying MCU from STM32 to Raspberry Pi RP2040 requires changing ZERO lines of sensor driver code!

### (2) Code Examples

#### Generic Hardware-Agnostic Sensor Driver using `embedded-hal` Traits

```rust
#![no_std]

use embedded_hal::delay::DelayNs;
use embedded_hal::digital::OutputPin;

/// A completely portable LED Flasher driver that works on ANY microcontroller!
pub struct LedFlasher<PIN, DELAY> {
    pin: PIN,
    delay: DELAY,
}

impl<PIN, DELAY> LedFlasher<PIN, DELAY>
where
    PIN: OutputPin,
    DELAY: DelayNs,
{
    pub fn new(pin: PIN, delay: DELAY) -> Self {
        LedFlasher { pin, delay }
    }

    pub fn flash_once(&mut self, delay_ms: u32) -> Result<(), PIN::Error> {
        self.pin.set_high()?;
        self.delay.delay_ms(delay_ms);
        self.pin.set_low()?;
        self.delay.delay_ms(delay_ms);
        Ok(())
    }
}
```

---

## 4. Common Mistakes & Pitfalls
### Mistake 2: Blocking the CPU in Busy-Spin Loops Instead of Using Non-Blocking Traits

**The mistake:** Writing drivers that spin-lock on hardware status flags when async/non-blocking traits are available.

**Why it's wrong:** Busy-spinning wastes microcontroller power and blocks concurrent event processing.

*Fix:* Use `embedded-hal-async` or non-blocking futures for peripheral I/O.

### Mistake 3: Hardcoding Bus Frequency Settings Directly Inside Generic Driver Implementations

**The mistake:** Embedding fixed SPI or I2C clock speeds inside generic driver code.

**Why it's wrong:** Different microcontroller platforms support different clock ranges. Hardcoding limits driver portability.

*Fix:* Pass clock configuration settings via initialization arguments or HAL traits.


### Mistake 1: Coupling a Sensor Driver Crate to a Specific Vendor HAL

**The mistake:** Writing a temperature sensor driver crate that imports `stm32f4xx_hal` directly instead of `embedded_hal::i2c::I2c`.

**Why it's wrong:** Importing a specific vendor HAL prevents your driver from being used on other microcontrollers (like RP2040 or ESP32).

---

## 5. Practice Exercises

### Exercise 1: Building a Platform-Agnostic LED Controller with Mock Pin Unit Testing

**Scenario:**
In embedded Rust, peripheral drivers must be decoupled from microcontroller hardware vendors so they can run on ARM Cortex-M, RISC-V, ESP32, or AVR chips.
Design a portable LED status controller struct `StatusLed<P>` generic over any GPIO pin `P` implementing `embedded_hal::digital::OutputPin`.

The driver must support:
1. `new(pin: P) -> Self` — Constructs the driver in an initial OFF state.
2. `turn_on(&mut self) -> Result<(), P::Error>` — Drives the hardware pin HIGH and updates internal state.
3. `turn_off(&mut self) -> Result<(), P::Error>` — Drives the hardware pin LOW and updates internal state.
4. `toggle(&mut self) -> Result<(), P::Error>` — Toggles state from ON to OFF or OFF to ON.

To verify driver logic without embedded hardware, implement a `MockPin` type conforming to `embedded_hal::digital::OutputPin` and write host unit tests (`#[test]`) with assertions testing successful output toggling and hardware error propagation.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #![no_std]
> 
> pub mod embedded_hal {
>     pub mod digital {
>         #[derive(Debug, Clone, Copy, PartialEq, Eq)]
>         pub enum PinState {
>             Low,
>             High,
>         }
> 
>         pub trait ErrorType {
>             type Error: core::fmt::Debug;
>         }
> 
>         pub trait OutputPin: ErrorType {
>             fn set_high(&mut self) -> Result<(), Self::Error>;
>             fn set_low(&mut self) -> Result<(), Self::Error>;
>             fn set_state(&mut self, state: PinState) -> Result<(), Self::Error> {
>                 match state {
>                     PinState::High => self.set_high(),
>                     PinState::Low => self.set_low(),
>                 }
>             }
>         }
>     }
> }
> 
> use embedded_hal::digital::{ErrorType, OutputPin, PinState};
> 
> /// Portable LED Controller generic over any pin implementing `OutputPin`.
> pub struct StatusLed<P> {
>     pin: P,
>     is_on: bool,
> }
> 
> impl<P: OutputPin> StatusLed<P> {
>     pub fn new(pin: P) -> Self {
>         Self { pin, is_on: false }
>     }
> 
>     pub fn turn_on(&mut self) -> Result<(), P::Error> {
>         self.pin.set_high()?;
>         self.is_on = true;
>         Ok(())
>     }
> 
>     pub fn turn_off(&mut self) -> Result<(), P::Error> {
>         self.pin.set_low()?;
>         self.is_on = false;
>         Ok(())
>     }
> 
>     pub fn toggle(&mut self) -> Result<(), P::Error> {
>         if self.is_on {
>             self.turn_off()
>         } else {
>             self.turn_on()
>         }
>     }
> 
>     pub fn is_on(&self) -> bool {
>         self.is_on
>     }
> }
> 
> // Mock Pin for host unit testing
> #[derive(Debug, PartialEq, Eq)]
> pub enum MockError {
>     HardwareFault,
> }
> 
> pub struct MockPin {
>     pub state: PinState,
>     pub state_changes: usize,
>     pub should_fail: bool,
> }
> 
> impl MockPin {
>     pub fn new() -> Self {
>         Self {
>             state: PinState::Low,
>             state_changes: 0,
>             should_fail: false,
>         }
>     }
> }
> 
> impl ErrorType for MockPin {
>     type Error = MockError;
> }
> 
> impl OutputPin for MockPin {
>     fn set_high(&mut self) -> Result<(), Self::Error> {
>         if self.should_fail {
>             return Err(MockError::HardwareFault);
>         }
>         self.state = PinState::High;
>         self.state_changes += 1;
>         Ok(())
>     }
> 
>     fn set_low(&mut self) -> Result<(), Self::Error> {
>         if self.should_fail {
>             return Err(MockError::HardwareFault);
>         }
>         self.state = PinState::Low;
>         self.state_changes += 1;
>         Ok(())
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_led_turn_on_and_off() {
>         let pin = MockPin::new();
>         let mut led = StatusLed::new(pin);
> 
>         assert!(!led.is_on());
> 
>         assert!(led.turn_on().is_ok());
>         assert!(led.is_on());
>         assert_eq!(led.pin.state, PinState::High);
>         assert_eq!(led.pin.state_changes, 1);
> 
>         assert!(led.turn_off().is_ok());
>         assert!(!led.is_on());
>         assert_eq!(led.pin.state, PinState::Low);
>         assert_eq!(led.pin.state_changes, 2);
>     }
> 
>     #[test]
>     fn test_led_toggle() {
>         let pin = MockPin::new();
>         let mut led = StatusLed::new(pin);
> 
>         assert!(led.toggle().is_ok());
>         assert!(led.is_on());
>         assert_eq!(led.pin.state, PinState::High);
> 
>         assert!(led.toggle().is_ok());
>         assert!(!led.is_on());
>         assert_eq!(led.pin.state, PinState::Low);
>     }
> 
>     #[test]
>     fn test_hardware_error_handling() {
>         let mut pin = MockPin::new();
>         pin.should_fail = true;
>         let mut led = StatusLed::new(pin);
> 
>         let result = led.turn_on();
>         assert_eq!(result, Err(MockError::HardwareFault));
>         assert!(!led.is_on());
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Generic Trait Bounds (`P: OutputPin`)**: The `StatusLed<P>` struct accepts any GPIO pin implementation without depending on a specific microcontroller crate (such as `stm32f4xx-hal` or `esp-hal`).
> 2. **Associated Error Types (`P::Error`)**: `embedded-hal` 1.0 traits use the `ErrorType` trait to associate a hardware error type with each peripheral. The `?` operator allows hardware failures to bubble up cleanly.
> 3. **Off-Target Mocking**: By implementing `OutputPin` on a synthetic `MockPin`, peripheral interaction logic can be thoroughly unit-tested on host platforms using standard `cargo test` without attaching physical microcontrollers.

---

### Exercise 2: Implementing a Platform-Agnostic I2C Temperature Sensor Driver

**Scenario:**
Hardware sensor driver crates communicate with digital sensors over I2C buses using `embedded_hal::i2c::I2c`.
Design a generic temperature sensor driver `Tmp102<I2C>` parameterized by `I2C: embedded_hal::i2c::I2c`.

The driver must implement:
1. `new(i2c: I2C, address: u8) -> Self` — Stores the I2C peripheral instance and 7-bit bus address.
2. `read_raw_temp(&mut self) -> Result<i16, I2C::Error>` — Reads 2 bytes from temperature register `0x00` via `write_read`, parses the big-endian 12-bit raw reading, and handles sign extension for negative temperatures.
3. `read_celsius(&mut self) -> Result<f32, I2C::Error>` — Converts the 12-bit raw reading into degrees Celsius (`raw * 0.0625°C`).

Implement a `MockI2c` peripheral simulator implementing `embedded_hal::i2c::I2c` that records register address reads and returns fake register bytes. Write unit tests verifying positive and negative temperature conversions as well as bus NACK error propagation.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #![no_std]
> 
> pub mod embedded_hal {
>     pub mod i2c {
>         pub trait ErrorType {
>             type Error: core::fmt::Debug;
>         }
> 
>         pub trait I2c: ErrorType {
>             fn write_read(
>                 &mut self,
>                 address: u8,
>                 bytes: &[u8],
>                 buffer: &mut [u8],
>             ) -> Result<(), Self::Error>;
>         }
>     }
> }
> 
> use embedded_hal::i2c::{ErrorType, I2c};
> 
> const TEMP_REGISTER: u8 = 0x00;
> 
> /// Platform-agnostic TMP102 Temperature Sensor Driver
> pub struct Tmp102<I2C> {
>     i2c: I2C,
>     address: u8,
> }
> 
> impl<I2C: I2c> Tmp102<I2C> {
>     pub fn new(i2c: I2C, address: u8) -> Self {
>         Self { i2c, address }
>     }
> 
>     /// Reads 12-bit raw temperature value from hardware register 0x00
>     pub fn read_raw_temp(&mut self) -> Result<i16, I2C::Error> {
>         let mut buffer = [0u8; 2];
>         self.i2c.write_read(self.address, &[TEMP_REGISTER], &mut buffer)?;
> 
>         let raw16 = u16::from_be_bytes(buffer);
>         let temp_12bit = (raw16 >> 4) as i16;
> 
>         // Perform 12-bit sign extension for negative values
>         let signed_temp = if temp_12bit & 0x0800 != 0 {
>             temp_12bit | !0x0FFF
>         } else {
>             temp_12bit
>         };
> 
>         Ok(signed_temp)
>     }
> 
>     /// Returns temperature in degrees Celsius (0.0625°C per LSB)
>     pub fn read_celsius(&mut self) -> Result<f32, I2C::Error> {
>         let raw = self.read_raw_temp()?;
>         Ok(raw as f32 * 0.0625)
>     }
> }
> 
> // Mock I2C bus simulator for testing
> #[derive(Debug, PartialEq, Eq)]
> pub enum I2cError {
>     BusNack,
>     BusTimeout,
> }
> 
> pub struct MockI2c {
>     pub expected_addr: u8,
>     pub register_data: [u8; 2],
>     pub should_nack: bool,
>     pub last_reg_read: Option<u8>,
> }
> 
> impl ErrorType for MockI2c {
>     type Error = I2cError;
> }
> 
> impl I2c for MockI2c {
>     fn write_read(
>         &mut self,
>         address: u8,
>         bytes: &[u8],
>         buffer: &mut [u8],
>     ) -> Result<(), Self::Error> {
>         if self.should_nack || address != self.expected_addr {
>             return Err(I2cError::BusNack);
>         }
> 
>         if !bytes.is_empty() {
>             self.last_reg_read = Some(bytes[0]);
>         }
> 
>         if buffer.len() >= 2 {
>             buffer[0] = self.register_data[0];
>             buffer[1] = self.register_data[1];
>         }
> 
>         Ok(())
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_positive_temperature_reading() {
>         // Register bytes 0x19, 0x00 -> u16 0x1900 >> 4 = 0x0190 (400)
>         // 400 * 0.0625 = 25.0°C
>         let mock_i2c = MockI2c {
>             expected_addr: 0x48,
>             register_data: [0x19, 0x00],
>             should_nack: false,
>             last_reg_read: None,
>         };
> 
>         let mut sensor = Tmp102::new(mock_i2c, 0x48);
> 
>         let raw = sensor.read_raw_temp().unwrap();
>         assert_eq!(raw, 400);
> 
>         let celsius = sensor.read_celsius().unwrap();
>         assert!((celsius - 25.0).abs() < 0.001);
>         assert_eq!(sensor.i2c.last_reg_read, Some(0x00));
>     }
> 
>     #[test]
>     fn test_negative_temperature_reading() {
>         // -10.0°C -> raw -160 -> 12-bit 0x0F60 -> shift left 4 = 0xF600 -> bytes [0xF6, 0x00]
>         let mock_i2c = MockI2c {
>             expected_addr: 0x48,
>             register_data: [0xF6, 0x00],
>             should_nack: false,
>             last_reg_read: None,
>         };
> 
>         let mut sensor = Tmp102::new(mock_i2c, 0x48);
>         let celsius = sensor.read_celsius().unwrap();
>         assert!((celsius - (-10.0)).abs() < 0.001);
>     }
> 
>     #[test]
>     fn test_i2c_bus_nack_error() {
>         let mock_i2c = MockI2c {
>             expected_addr: 0x48,
>             register_data: [0x00, 0x00],
>             should_nack: true,
>             last_reg_read: None,
>         };
> 
>         let mut sensor = Tmp102::new(mock_i2c, 0x48);
>         let result = sensor.read_celsius();
>         assert_eq!(result, Err(I2cError::BusNack));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Portable Bus Abstraction (`I2C: embedded_hal::i2c::I2c`)**: The driver depends exclusively on the portable `I2c::write_read` trait method, meaning the driver crate compiles identically for any MCU.
> 2. **Bitwise Arithmetic in `#![no_std]`**: Conversion operations like `u16::from_be_bytes`, bit shifts (`>> 4`), and sign extension (`| !0x0FFF`) run purely in `core` without requiring allocation or operating system assistance.
> 3. **Simulating Hardware Transactions**: `MockI2c` verifies both register address transmission and raw byte parsing while allowing simulation of hardware NACK errors.

---

### Exercise 3: Software Pulse Generator Combining GPIO (`OutputPin`) and Delay (`DelayNs`)

**Scenario:**
Microcontroller applications often generate pulse sequences (e.g., ultrasonic trigger pulses or stepper motor step clocking) using GPIO output pins and microsecond delays.
Design a generic pulse generator struct `PulseGenerator<PIN, DELAY>` parameterized by `PIN: embedded_hal::digital::OutputPin` and `DELAY: embedded_hal::delay::DelayNs`.

Implement:
1. `new(pin: PIN, delay: DELAY) -> Self` — Initializes the pulse generator.
2. `emit_pulse_train(&mut self, high_us: u32, low_us: u32, count: u32) -> Result<(), PIN::Error>` — Drives the pin HIGH for `high_us` microseconds and LOW for `low_us` microseconds, repeating `count` times.

Implement `MockPin` and `MockDelay` test helpers, and write unit tests (`#[test]`) with assertions verifying pin transition history sequences and total delay microseconds.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #![no_std]
> 
> pub mod embedded_hal {
>     pub mod digital {
>         #[derive(Debug, Clone, Copy, PartialEq, Eq)]
>         pub enum PinState {
>             Low,
>             High,
>         }
> 
>         pub trait ErrorType {
>             type Error: core::fmt::Debug;
>         }
> 
>         pub trait OutputPin: ErrorType {
>             fn set_high(&mut self) -> Result<(), Self::Error>;
>             fn set_low(&mut self) -> Result<(), Self::Error>;
>         }
>     }
> 
>     pub mod delay {
>         pub trait DelayNs {
>             fn delay_ns(&mut self, ns: u32);
>             fn delay_us(&mut self, us: u32) {
>                 self.delay_ns(us.saturating_mul(1000));
>             }
>             fn delay_ms(&mut self, ms: u32) {
>                 self.delay_us(ms.saturating_mul(1000));
>             }
>         }
>     }
> }
> 
> use embedded_hal::delay::DelayNs;
> use embedded_hal::digital::{ErrorType, OutputPin, PinState};
> 
> /// Software Pulse Generator combining digital GPIO output and Delay traits
> pub struct PulseGenerator<PIN, DELAY> {
>     pin: PIN,
>     delay: DELAY,
> }
> 
> impl<PIN, DELAY> PulseGenerator<PIN, DELAY>
> where
>     PIN: OutputPin,
>     DELAY: DelayNs,
> {
>     pub fn new(pin: PIN, delay: DELAY) -> Self {
>         Self { pin, delay }
>     }
> 
>     /// Emits a square-wave pulse train of `count` cycles
>     pub fn emit_pulse_train(
>         &mut self,
>         high_us: u32,
>         low_us: u32,
>         count: u32,
>     ) -> Result<(), PIN::Error> {
>         for _ in 0..count {
>             self.pin.set_high()?;
>             self.delay.delay_us(high_us);
>             self.pin.set_low()?;
>             self.delay.delay_us(low_us);
>         }
>         Ok(())
>     }
> }
> 
> // Mock hardware components for host testing
> #[derive(Debug, PartialEq, Eq)]
> pub struct MockError;
> 
> pub struct MockPin {
>     pub state_history: [PinState; 16],
>     pub history_len: usize,
> }
> 
> impl MockPin {
>     pub fn new() -> Self {
>         Self {
>             state_history: [PinState::Low; 16],
>             history_len: 0,
>         }
>     }
> }
> 
> impl ErrorType for MockPin {
>     type Error = MockError;
> }
> 
> impl OutputPin for MockPin {
>     fn set_high(&mut self) -> Result<(), Self::Error> {
>         if self.history_len < self.state_history.len() {
>             self.state_history[self.history_len] = PinState::High;
>             self.history_len += 1;
>         }
>         Ok(())
>     }
> 
>     fn set_low(&mut self) -> Result<(), Self::Error> {
>         if self.history_len < self.state_history.len() {
>             self.state_history[self.history_len] = PinState::Low;
>             self.history_len += 1;
>         }
>         Ok(())
>     }
> }
> 
> pub struct MockDelay {
>     pub total_us_delayed: u64,
> }
> 
> impl MockDelay {
>     pub fn new() -> Self {
>         Self { total_us_delayed: 0 }
>     }
> }
> 
> impl DelayNs for MockDelay {
>     fn delay_ns(&mut self, ns: u32) {
>         self.total_us_delayed += (ns / 1000) as u64;
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_pulse_train_generation() {
>         let pin = MockPin::new();
>         let delay = MockDelay::new();
>         let mut pulser = PulseGenerator::new(pin, delay);
> 
>         let result = pulser.emit_pulse_train(10, 20, 2);
>         assert!(result.is_ok());
> 
>         // Verify sequence of pin transitions
>         assert_eq!(pulser.pin.history_len, 4);
>         assert_eq!(pulser.pin.state_history[0], PinState::High);
>         assert_eq!(pulser.pin.state_history[1], PinState::Low);
>         assert_eq!(pulser.pin.state_history[2], PinState::High);
>         assert_eq!(pulser.pin.state_history[3], PinState::Low);
> 
>         // Verify total delay duration: 2 * (10us + 20us) = 60us
>         assert_eq!(pulser.delay.total_us_delayed, 60);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Trait Composition**: `PulseGenerator` demonstrates composing multiple `embedded-hal` peripheral interfaces (`OutputPin` for GPIO control and `DelayNs` for precise timing).
> 2. **Provided Trait Methods**: `DelayNs::delay_us` automatically delegates to `delay_ns`, illustrating how trait default implementations reduce boilerplate for peripheral implementers.
> 3. **Integrated Hardware Mock Testing**: Combining `MockPin` and `MockDelay` ensures signal patterns and duration accumulation are validated simultaneously before flashing code onto real target hardware.

---

---

## 6. Related Terms

- [HAL (Hardware Abstraction Layer)](hal.md) — Related concept: HAL (Hardware Abstraction Layer).
- [`svd2rust`](svd2rust.md) — Related concept: `svd2rust`.
- [PAC (Peripheral Access Crate)](pac.md) — Related concept: PAC (Peripheral Access Crate).

---

## 7. Key Takeaways

- `embedded-hal` provides shared, platform-agnostic trait interfaces for embedded peripherals.
- Defines traits for `OutputPin`, `InputPin`, `SpiBus`, `I2c`, and `DelayNs`.
- Enables reusable, ecosystem-wide sensor and display driver crates.
