# HAL (Hardware Abstraction Layer)

> **Level 17 — Embedded & Systems Programming**
> A high-level, chip-family crate (such as `stm32f4xx-hal` or `nrf52840-hal`) that consumes low-level raw PAC registers and exposes ergonomic, type-safe peripheral drivers (GPIO pins, Serial UART, I2C, SPI) implementing standard `embedded-hal` traits.

---

## 1. Prerequisites

- [PAC (Peripheral Access Crate)](../level_17/pac.md) — The low-level register crate consumed by a HAL.
- [`embedded-hal`](../level_17/embedded_hal.md) — Standard embedded trait interfaces implemented by a HAL.
- [Type-State Pattern](../level_14/type_state_pattern.md) — Used by HALs to track GPIO pin modes at compile time.

---

## 2. Term Category

**Embedded / Drivers / Architecture**: A Hardware Abstraction Layer (HAL) bridges raw chip registers (PAC) and portable embedded applications. It uses Rust's type system (including the Type-State Pattern) to ensure hardware safety — for example, preventing a developer from reading a GPIO pin configured as an output pin at compile time!

---

## 3. Environment Context

**Microcontroller Ecosystem**: Specific to microcontroller product families (e.g. `stm32f4xx-hal`, `rp2040-hal`, `esp32-hal`).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"

Writing raw PAC register bit manipulations for every LED blink or UART transmission requires reading 1,000-page hardware reference manuals.

HAL crates provide high-level abstractions:
- `gpioa.pa5.into_push_pull_output()` converts raw GPIO Pin 5 into a type-safe output pin.
- `led.set_high()` sets the pin voltage without manual bit shifts.
- Implements standard `embedded-hal` traits so generic sensor drivers work across different chip families.

### (2) Code Examples

#### Configuring GPIO and Serial UART with an STM32 HAL

```rust
// Using stm32f4xx-hal
use stm32f4xx_hal::{pac, prelude::*};

pub fn init_hardware() {
    let dp = pac::Peripherals::take().unwrap();

    // Constrain RCC clock registers
    let rcc = dp.RCC.constrain();
    let clocks = rcc.cfgr.sysclk(48.MHz()).freeze();

    // Split GPIOA into individual type-safe pins
    let gpioa = dp.GPIOA.split();

    // Type-State Pattern: Convert Pin PA5 into Push-Pull Output LED pin
    let mut led = gpioa.pa5.into_push_pull_output();

    // High-level API call:
    led.set_high();
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Attempting to Re-Configure a Pin in Wrong State

**The mistake:** Trying to call `.set_high()` on a GPIO pin configured as an input pin.

**Why it's wrong:** Rust HALs use the Type-State Pattern. `.set_high()` does not exist on `Pin<Input>`, triggering a compile-time type error before flashing the chip!

---

## 6. Practice Exercises

### Exercise 1: Type-State GPIO Driver with Safe Pin Transitions

**Problem:** Design a `#![no_std]` GPIO Hardware Abstraction Layer (HAL) driver for a microcontroller pin using the Type-State Pattern. Define zero-sized state markers (`Input`, `Output<PushPull>`, `Output<OpenDrain>`), implement state transitions (`into_push_pull_output`, `into_open_drain_output`, `into_input`), restrict output operations (`set_high`, `set_low`, `toggle`) to output pins, and write unit tests in a `#[cfg(test)]` module asserting pin state changes and bitmask register updates.

> [!check]- Answer
> ```rust
> #![no_std]
> 
> use core::marker::PhantomData;
> 
> // Zero-Sized Type-State Markers
> pub struct Input;
> pub struct PushPull;
> pub struct OpenDrain;
> pub struct Output<MODE> {
>     _mode: PhantomData<MODE>,
> }
> 
> // Mock Hardware Register State
> #[derive(Debug, PartialEq, Eq)]
> pub struct MockGpioRegister {
>     pub output_data: u8,
>     pub mode_register: u8, // 0 = Input, Bit set = Output mode
> }
> 
> impl MockGpioRegister {
>     pub const fn new() -> Self {
>         Self { output_data: 0, mode_register: 0 }
>     }
> }
> 
> // Type-State HAL Pin Driver
> pub struct Pin<'a, const ID: u8, MODE> {
>     reg: &'a mut MockGpioRegister,
>     _mode: PhantomData<MODE>,
> }
> 
> impl<'a, const ID: u8> Pin<'a, ID, Input> {
>     pub fn new(reg: &'a mut MockGpioRegister) -> Self {
>         reg.mode_register &= !(1 << ID); // Configure bit to 0 (Input)
>         Pin {
>             reg,
>             _mode: PhantomData,
>         }
>     }
> 
>     pub fn into_push_pull_output(self) -> Pin<'a, ID, Output<PushPull>> {
>         self.reg.mode_register |= 1 << ID; // Set mode bit (Output)
>         Pin {
>             reg: self.reg,
>             _mode: PhantomData,
>         }
>     }
> 
>     pub fn into_open_drain_output(self) -> Pin<'a, ID, Output<OpenDrain>> {
>         self.reg.mode_register |= 1 << ID; // Set mode bit (Output)
>         Pin {
>             reg: self.reg,
>             _mode: PhantomData,
>         }
>     }
> 
>     pub fn is_high(&self) -> bool {
>         (self.reg.output_data & (1 << ID)) != 0
>     }
> }
> 
> impl<'a, const ID: u8, M> Pin<'a, ID, Output<M>> {
>     pub fn set_high(&mut self) {
>         self.reg.output_data |= 1 << ID;
>     }
> 
>     pub fn set_low(&mut self) {
>         self.reg.output_data &= !(1 << ID);
>     }
> 
>     pub fn toggle(&mut self) {
>         self.reg.output_data ^= 1 << ID;
>     }
> 
>     pub fn into_input(self) -> Pin<'a, ID, Input> {
>         self.reg.mode_register &= !(1 << ID);
>         Pin {
>             reg: self.reg,
>             _mode: PhantomData,
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_gpio_type_state_transitions_and_output() {
>         let mut mock_reg = MockGpioRegister::new();
> 
>         // Initialize Pin 5 in Input state
>         let pin5_input = Pin::<5, Input>::new(&mut mock_reg);
>         assert_eq!(pin5_input.reg.mode_register & (1 << 5), 0);
>         assert_eq!(pin5_input.is_high(), false);
> 
>         // Transition to PushPull Output
>         let mut pin5_out = pin5_input.into_push_pull_output();
>         assert_eq!(pin5_out.reg.mode_register & (1 << 5), 1 << 5);
> 
>         // Perform output operations
>         pin5_out.set_high();
>         assert_eq!(pin5_out.reg.output_data & (1 << 5), 1 << 5);
> 
>         pin5_out.toggle();
>         assert_eq!(pin5_out.reg.output_data & (1 << 5), 0);
> 
>         pin5_out.set_low();
>         assert_eq!(pin5_out.reg.output_data & (1 << 5), 0);
> 
>         // Transition back to Input
>         let pin5_back_to_in = pin5_out.into_input();
>         assert_eq!(pin5_back_to_in.reg.mode_register & (1 << 5), 0);
>     }
> }
> ```
>
> **Explanation:**
> 1. **Zero-Cost Type-State Encoding**: By using zero-sized marker structs (`Input`, `PushPull`, `OpenDrain`) and `PhantomData<MODE>`, the pin mode state is tracked entirely at compile time without incurring runtime RAM or code size penalties.
> 2. **Ownership and Move Semantics**: State transition methods consume `self` by value (e.g., `into_push_pull_output(self)`). Moving ownership invalidates the previous `Pin<ID, Input>` binding, preventing pin aliasing or illegal concurrent configurations.
> 3. **Compile-Time Safety Enforcement**: Output functions (`set_high()`, `toggle()`) are implemented exclusively on `Pin<ID, Output<M>>`. Invoking `.set_high()` on a `Pin<ID, Input>` produces a compile-time type mismatch error before code can be flashed to hardware.

---

### Exercise 2: Implementing a HAL Timer Peripheral & Frequency Prescaling Driver

**Problem:** Construct a `#![no_std]` HAL timer driver (`TimerDriver`) wrapping peripheral registers (`PSC`, `ARR`, `CNT`, `CR1`). Implement methods to initialize the timer driver with a system clock frequency, calculate clock prescaler/auto-reload values for a target frequency in `start()`, and execute blocking tick delays in `delay_ticks()`. Include unit tests asserting prescaler calculations and delay completion.

> [!check]- Answer
> ```rust
> #![no_std]
> 
> pub struct TimerRegisters {
>     pub psc: u32, // Prescaler Register
>     pub arr: u32, // Auto-Reload Register
>     pub cnt: u32, // Counter Register
>     pub cr1: u32, // Control Register 1 (Bit 0: Enable)
> }
> 
> impl TimerRegisters {
>     pub const fn new() -> Self {
>         Self { psc: 0, arr: 0, cnt: 0, cr1: 0 }
>     }
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub enum TimerError {
>     InvalidFrequency,
> }
> 
> pub struct TimerDriver<'a> {
>     regs: &'a mut TimerRegisters,
>     sysclk_hz: u32,
> }
> 
> impl<'a> TimerDriver<'a> {
>     pub fn new(regs: &'a mut TimerRegisters, sysclk_hz: u32) -> Self {
>         TimerDriver { regs, sysclk_hz }
>     }
> 
>     /// Configures timer prescaler and auto-reload values for target frequency
>     pub fn start(&mut self, target_freq_hz: u32) -> Result<(), TimerError> {
>         if target_freq_hz == 0 || target_freq_hz > self.sysclk_hz {
>             return Err(TimerError::InvalidFrequency);
>         }
> 
>         let total_divider = self.sysclk_hz / target_freq_hz;
>         let psc = 0; // 1:1 prescaler
>         let arr = total_divider.saturating_sub(1);
> 
>         self.regs.psc = psc;
>         self.regs.arr = arr;
>         self.regs.cnt = 0;
>         self.regs.cr1 |= 1; // Enable counter
> 
>         Ok(())
>     }
> 
>     pub fn delay_ticks(&mut self, ticks: u32) {
>         self.regs.cnt = 0;
>         self.regs.cr1 |= 1; // Enable timer
> 
>         // Simulate hardware counter ticking up to target
>         while self.regs.cnt < ticks {
>             self.regs.cnt += 1;
>         }
> 
>         self.regs.cr1 &= !1; // Disable timer upon completion
>     }
> 
>     pub fn is_counter_enabled(&self) -> bool {
>         (self.regs.cr1 & 1) != 0
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_timer_driver_configuration_and_delay() {
>         let mut regs = TimerRegisters::new();
>         let mut timer = TimerDriver::new(&mut regs, 8_000_000); // 8 MHz clock
> 
>         // Test valid frequency configuration (1 kHz target)
>         let res = timer.start(1_000);
>         assert!(res.is_ok());
>         assert_eq!(timer.regs.arr, 7_999); // (8,000,000 / 1,000) - 1
>         assert_eq!(timer.is_counter_enabled(), true);
> 
>         // Test invalid frequency error handling
>         let err_res = timer.start(16_000_000);
>         assert_eq!(err_res, Err(TimerError::InvalidFrequency));
> 
>         // Test blocking tick delay execution
>         timer.delay_ticks(100);
>         assert_eq!(timer.regs.cnt, 100);
>         assert_eq!(timer.is_counter_enabled(), false);
>     }
> }
> ```
>
> **Explanation:**
> 1. **Peripheral Register Encapsulation**: The `TimerDriver` wraps memory-mapped registers (`PSC`, `ARR`, `CNT`, `CR1`), providing safe, ergonomic hardware abstractions over raw bit manipulations.
> 2. **Frequency Prescaling Calculations**: The driver derives auto-reload values using clock math (`ARR = (sysclk / target_freq) - 1`), allowing high-level applications to request human-readable frequencies (e.g., 1 kHz).
> 3. **Robust Error Handling**: Instead of risking silent integer overflow or division-by-zero during clock configuration, invalid parameters are safely trapped using `Result<T, TimerError>`.

---

### Exercise 3: HAL Serial UART Driver with Status Flag Trapping & Error Handling

**Problem:** Implement a `#![no_std]` HAL UART driver (`UartDriver`) wrapping peripheral registers (`SR`, `TXDR`, `RXDR`). Implement `send_byte`, `send_str`, and `read_byte` while monitoring status bits (`STATUS_TXE`, `STATUS_RXNE`, `STATUS_ORE`, `STATUS_FE`). Write unit tests in a `#[cfg(test)]` module verifying string transmission and the trapping/clearing of overrun (`STATUS_ORE`) and framing (`STATUS_FE`) errors.

> [!check]- Answer
> ```rust
> #![no_std]
> 
> pub const STATUS_FE: u8 = 1 << 1;   // Framing Error flag
> pub const STATUS_ORE: u8 = 1 << 3;  // Overrun Error flag
> pub const STATUS_RXNE: u8 = 1 << 5; // Read Data Register Not Empty
> pub const STATUS_TXE: u8 = 1 << 7;  // Transmit Data Register Empty
> 
> pub struct UartPeripheralRegisters {
>     pub sr: u8,   // Status Register
>     pub txdr: u8, // Transmit Data Register
>     pub rxdr: u8, // Receive Data Register
> }
> 
> impl UartPeripheralRegisters {
>     pub const fn new() -> Self {
>         Self { sr: STATUS_TXE, txdr: 0, rxdr: 0 }
>     }
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub enum UartError {
>     TxNotReady,
>     RxEmpty,
>     OverrunError,
>     FramingError,
> }
> 
> pub struct UartDriver<'a> {
>     regs: &'a mut UartPeripheralRegisters,
> }
> 
> impl<'a> UartDriver<'a> {
>     pub fn new(regs: &'a mut UartPeripheralRegisters) -> Self {
>         UartDriver { regs }
>     }
> 
>     pub fn send_byte(&mut self, byte: u8) -> Result<(), UartError> {
>         if (self.regs.sr & STATUS_TXE) == 0 {
>             return Err(UartError::TxNotReady);
>         }
>         self.regs.txdr = byte;
>         Ok(())
>     }
> 
>     pub fn send_str(&mut self, s: &str) -> Result<(), UartError> {
>         for byte in s.bytes() {
>             self.send_byte(byte)?;
>         }
>         Ok(())
>     }
> 
>     pub fn read_byte(&mut self) -> Result<u8, UartError> {
>         let status = self.regs.sr;
> 
>         // Check hardware status flags for communication errors
>         if (status & STATUS_ORE) != 0 {
>             self.regs.sr &= !STATUS_ORE; // Clear error flag
>             return Err(UartError::OverrunError);
>         }
>         if (status & STATUS_FE) != 0 {
>             self.regs.sr &= !STATUS_FE; // Clear error flag
>             return Err(UartError::FramingError);
>         }
> 
>         if (status & STATUS_RXNE) == 0 {
>             return Err(UartError::RxEmpty);
>         }
> 
>         let byte = self.regs.rxdr;
>         self.regs.sr &= !STATUS_RXNE; // Clear RXNE after reading byte
>         Ok(byte)
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_uart_transmission_and_string_sending() {
>         let mut regs = UartPeripheralRegisters::new();
>         let mut uart = UartDriver::new(&mut regs);
> 
>         // Transmit string byte by byte
>         assert!(uart.send_str("OK").is_ok());
>         assert_eq!(uart.regs.txdr, b'K');
>     }
> 
>     #[test]
>     fn test_uart_reception_and_hardware_errors() {
>         let mut regs = UartPeripheralRegisters::new();
>         let mut uart = UartDriver::new(&mut regs);
> 
>         // Attempt reading from empty buffer
>         assert_eq!(uart.read_byte(), Err(UartError::RxEmpty));
> 
>         // Simulate valid byte reception
>         uart.regs.rxdr = b'A';
>         uart.regs.sr |= STATUS_RXNE;
>         assert_eq!(uart.read_byte(), Ok(b'A'));
>         assert_eq!(uart.regs.sr & STATUS_RXNE, 0);
> 
>         // Simulate Overrun Error flag
>         uart.regs.sr |= STATUS_ORE;
>         assert_eq!(uart.read_byte(), Err(UartError::OverrunError));
>         assert_eq!(uart.regs.sr & STATUS_ORE, 0); // Flag cleared after read
> 
>         // Simulate Framing Error flag
>         uart.regs.sr |= STATUS_FE;
>         assert_eq!(uart.read_byte(), Err(UartError::FramingError));
>         assert_eq!(uart.regs.sr & STATUS_FE, 0);
>     }
> }
> ```
>
> **Explanation:**
> 1. **Hardware Bitmask Trapping**: The HAL inspects hardware status registers (`SR`) before performing data register operations, preventing unbuffered data overwrites or reading invalid register values.
> 2. **Error Recovery & Bit Clearing**: Hardware timing anomalies (such as bit alignment or missed bytes) are converted into structured Rust `UartError` variants while clearing status bits to restore serial line functionality.
> 3. **High-Level Trait Bridging**: High-level abstractions like `send_str` map Rust slice primitives (`&str`) to low-level register writes using error propagation (`?`), illustrating the essential role of HAL crates in embedded software systems.

---

## 7. Key Takeaways

- A HAL provides high-level peripheral drivers built on top of a low-level PAC.
- Uses the Type-State Pattern to enforce hardware pin configurations at compile time.
- Implements `embedded-hal` traits for cross-chip driver compatibility.
