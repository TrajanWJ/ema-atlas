import { describe, it, expect } from 'vitest';
import { getGreeting, getBootLines } from '../../src/lib/boot-messages';

describe('getGreeting', () => {
	it('returns midnight message for 3am', () => {
		expect(getGreeting(3)).toBe('burning the midnight oil?');
	});

	it('returns early morning message for 6am', () => {
		expect(getGreeting(6)).toBe('early bird gets the worm.');
	});

	it('returns morning message for 9am', () => {
		expect(getGreeting(9)).toBe('good morning.');
	});

	it('returns afternoon message for 1pm', () => {
		expect(getGreeting(13)).toBe('afternoon session.');
	});

	it('returns mid-afternoon message for 3pm', () => {
		expect(getGreeting(15)).toBe('deep into it.');
	});

	it('returns evening message for 6pm', () => {
		expect(getGreeting(18)).toBe('evening mode.');
	});

	it('returns night owl message for 10pm', () => {
		expect(getGreeting(22)).toBe('night owl session.');
	});

	it('returns midnight message for midnight (0)', () => {
		expect(getGreeting(0)).toBe('burning the midnight oil?');
	});
});

describe('getBootLines', () => {
	it('includes version, initialization, and greeting', () => {
		const lines = getBootLines(10, 1);
		expect(lines).toHaveLength(4);
		expect(lines[0]?.text).toBe('place.org v0.2.0');
		expect(lines[0]?.color).toBe('success');
		expect(lines[1]?.text).toBe('initializing workspace...');
		expect(lines[1]?.color).toBe('muted');
		expect(lines[2]?.text).toBe('database ready (v1)');
		expect(lines[2]?.color).toBe('muted');
		expect(lines[3]?.text).toBe('good morning.');
		expect(lines[3]?.color).toBe('accent');
	});

	it('includes entry count when provided', () => {
		const lines = getBootLines(15, 2, 5);
		expect(lines).toHaveLength(5);
		expect(lines[3]?.text).toBe('5 entries loaded');
		expect(lines[3]?.color).toBe('muted');
		expect(lines[4]?.text).toBe('deep into it.');
		expect(lines[4]?.color).toBe('accent');
	});

	it('omits entry count when not provided', () => {
		const lines = getBootLines(15, 2);
		expect(lines).toHaveLength(4);
		expect(lines[3]?.text).toMatch(/deep into it/);
	});

	it('handles zero entries', () => {
		const lines = getBootLines(9, 1, 0);
		expect(lines).toHaveLength(5);
		expect(lines[3]?.text).toBe('0 entries loaded');
	});

	it('uses correct database version in output', () => {
		const lines = getBootLines(12, 3);
		expect(lines[2]?.text).toBe('database ready (v3)');
	});
});
