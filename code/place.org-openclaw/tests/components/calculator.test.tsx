import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CalculatorApp } from '../../src/components/apps/calculator/CalculatorApp';

function getDisplay() {
	return screen.getByTestId('calc-display').textContent ?? '';
}

function clickButton(label: string) {
	// Find by text — use exact to avoid matching partial labels
	const btn = screen.getByRole('button', { name: label });
	fireEvent.click(btn);
}

describe('CalculatorApp', () => {
	it('renders with initial display of 0', () => {
		render(<CalculatorApp />);
		expect(getDisplay()).toBe('0');
	});

	it('addition: 2 + 3 = 5', () => {
		render(<CalculatorApp />);
		clickButton('2');
		clickButton('+');
		clickButton('3');
		clickButton('=');
		expect(getDisplay()).toBe('5');
	});

	it('division: 9 ÷ 3 = 3', () => {
		render(<CalculatorApp />);
		clickButton('9');
		clickButton('÷');
		clickButton('3');
		clickButton('=');
		expect(getDisplay()).toBe('3');
	});

	it('subtraction: 8 - 5 = 3', () => {
		render(<CalculatorApp />);
		clickButton('8');
		clickButton('-');
		clickButton('5');
		clickButton('=');
		expect(getDisplay()).toBe('3');
	});

	it('multiplication: 4 × 6 = 24', () => {
		render(<CalculatorApp />);
		clickButton('4');
		clickButton('×');
		clickButton('6');
		clickButton('=');
		expect(getDisplay()).toBe('24');
	});

	it('clear resets display to 0', () => {
		render(<CalculatorApp />);
		clickButton('7');
		clickButton('8');
		expect(getDisplay()).toBe('78');
		clickButton('C');
		expect(getDisplay()).toBe('0');
	});

	it('backspace removes last digit', () => {
		render(<CalculatorApp />);
		clickButton('1');
		clickButton('2');
		clickButton('3');
		expect(getDisplay()).toBe('123');
		clickButton('⌫');
		expect(getDisplay()).toBe('12');
	});

	it('backspace on single digit returns 0', () => {
		render(<CalculatorApp />);
		clickButton('5');
		clickButton('⌫');
		expect(getDisplay()).toBe('0');
	});

	it('division by zero shows Error', () => {
		render(<CalculatorApp />);
		clickButton('9');
		clickButton('÷');
		clickButton('0');
		clickButton('=');
		expect(getDisplay()).toBe('Error');
	});

	it('decimal input: 1.5 + 1.5 = 3', { timeout: 10000 }, () => {
		render(<CalculatorApp />);
		clickButton('1');
		clickButton('.');
		clickButton('5');
		clickButton('+');
		clickButton('1');
		clickButton('.');
		clickButton('5');
		clickButton('=');
		expect(getDisplay()).toBe('3');
	});
});
