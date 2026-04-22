'use client';

import { useCallback, useEffect, useReducer } from 'react';

// --- Types ---

type Operator = '+' | '-' | '×' | '÷' | '%';

interface CalculatorState {
	readonly display: string;
	readonly operand1: string | null;
	readonly operator: Operator | null;
	readonly waitingForOperand2: boolean;
	readonly justEvaluated: boolean;
}

type CalculatorAction =
	| { readonly type: 'DIGIT'; readonly digit: string }
	| { readonly type: 'DECIMAL' }
	| { readonly type: 'OPERATOR'; readonly operator: Operator }
	| { readonly type: 'EQUALS' }
	| { readonly type: 'CLEAR' }
	| { readonly type: 'BACKSPACE' }
	| { readonly type: 'NEGATE' };

// --- Constants ---

const MAX_DIGITS = 12;

const INITIAL_STATE: CalculatorState = {
	display: '0',
	operand1: null,
	operator: null,
	waitingForOperand2: false,
	justEvaluated: false,
};

// --- Pure math ---

function applyOperator(a: number, op: Operator, b: number): number {
	switch (op) {
		case '+': return a + b;
		case '-': return a - b;
		case '×': return a * b;
		case '÷': return b === 0 ? Number.NaN : a / b;
		case '%': return a % b;
	}
}

function formatResult(value: number): string {
	if (!Number.isFinite(value)) return 'Error';
	// Avoid scientific notation for displayable numbers
	const str = String(value);
	if (str.length <= MAX_DIGITS) return str;
	// Try toPrecision to fit
	const precise = Number(value.toPrecision(MAX_DIGITS));
	return String(precise);
}

// --- Reducer ---

function calculatorReducer(state: CalculatorState, action: CalculatorAction): CalculatorState {
	switch (action.type) {
		case 'DIGIT': {
			const { digit } = action;
			if (state.waitingForOperand2) {
				return { ...state, display: digit === '0' ? '0' : digit, waitingForOperand2: false };
			}
			if (state.justEvaluated) {
				return { ...state, display: digit, justEvaluated: false, operand1: null, operator: null };
			}
			if (state.display === '0' && digit !== '.') {
				return { ...state, display: digit };
			}
			if (state.display.replace('-', '').replace('.', '').length >= MAX_DIGITS) return state;
			return { ...state, display: state.display + digit };
		}

		case 'DECIMAL': {
			if (state.waitingForOperand2) {
				return { ...state, display: '0.', waitingForOperand2: false };
			}
			if (state.display.includes('.')) return state;
			return { ...state, display: state.display + '.', justEvaluated: false };
		}

		case 'OPERATOR': {
			const { operator } = action;
			// If we already have op1 and operator, evaluate first
			if (state.operand1 !== null && state.operator !== null && !state.waitingForOperand2) {
				const result = applyOperator(
					parseFloat(state.operand1),
					state.operator,
					parseFloat(state.display),
				);
				const formatted = formatResult(result);
				return {
					display: formatted,
					operand1: formatted,
					operator,
					waitingForOperand2: true,
					justEvaluated: false,
				};
			}
			return {
				...state,
				operand1: state.display,
				operator,
				waitingForOperand2: true,
				justEvaluated: false,
			};
		}

		case 'EQUALS': {
			if (state.operand1 === null || state.operator === null) return state;
			const b = state.waitingForOperand2 ? state.operand1 : state.display;
			const result = applyOperator(parseFloat(state.operand1), state.operator, parseFloat(b));
			const formatted = formatResult(result);
			return {
				display: formatted,
				operand1: null,
				operator: null,
				waitingForOperand2: false,
				justEvaluated: true,
			};
		}

		case 'CLEAR':
			return INITIAL_STATE;

		case 'BACKSPACE': {
			if (state.justEvaluated || state.waitingForOperand2) return state;
			if (state.display.length <= 1 || (state.display.startsWith('-') && state.display.length === 2)) {
				return { ...state, display: '0' };
			}
			return { ...state, display: state.display.slice(0, -1) };
		}

		case 'NEGATE': {
			if (state.display === '0' || state.display === 'Error') return state;
			const negated = state.display.startsWith('-')
				? state.display.slice(1)
				: '-' + state.display;
			return { ...state, display: negated };
		}
	}
}

// --- Sub-components ---

interface ButtonProps {
	readonly label: string;
	readonly variant: 'number' | 'operator' | 'equals' | 'clear' | 'utility';
	readonly wide?: boolean;
	readonly onClick: () => void;
}

function CalcButton({ label, variant, wide = false, onClick }: ButtonProps) {
	const base: React.CSSProperties = {
		fontFamily: 'monospace',
		fontSize: '1.1rem',
		fontWeight: 500,
		cursor: 'pointer',
		border: 'none',
		outline: 'none',
		borderRadius: '0.5rem',
		gridColumn: wide ? 'span 2' : undefined,
		transition: 'background 0.1s, box-shadow 0.1s',
		height: '3.25rem',
	};

	const variantStyles: Record<ButtonProps['variant'], React.CSSProperties> = {
		number: {
			background: 'rgba(255,255,255,0.06)',
			color: 'var(--text-primary)',
			boxShadow: '0 0 0 1px rgba(255,255,255,0.07)',
		},
		operator: {
			background: 'rgba(99,179,237,0.15)',
			color: 'var(--accent-blue, #63b3ed)',
			boxShadow: '0 0 0 1px rgba(99,179,237,0.2)',
		},
		equals: {
			background: 'var(--accent-blue, #3b82f6)',
			color: '#fff',
			boxShadow: '0 0 8px rgba(59,130,246,0.4)',
		},
		clear: {
			background: 'rgba(248,113,113,0.15)',
			color: 'var(--accent-red, #f87171)',
			boxShadow: '0 0 0 1px rgba(248,113,113,0.2)',
		},
		utility: {
			background: 'rgba(255,255,255,0.04)',
			color: 'var(--text-secondary)',
			boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
		},
	};

	return (
		<button
			type="button"
			style={{ ...base, ...variantStyles[variant] }}
			onClick={onClick}
			onMouseEnter={(e) => {
				const el = e.currentTarget;
				if (variant === 'number') el.style.boxShadow = '0 0 8px rgba(255,255,255,0.12)';
				if (variant === 'operator') el.style.boxShadow = '0 0 10px rgba(99,179,237,0.4)';
				if (variant === 'clear') el.style.boxShadow = '0 0 10px rgba(248,113,113,0.4)';
				if (variant === 'utility') el.style.boxShadow = '0 0 6px rgba(255,255,255,0.1)';
			}}
			onMouseLeave={(e) => {
				const el = e.currentTarget;
				el.style.boxShadow = variantStyles[variant].boxShadow as string;
			}}
		>
			{label}
		</button>
	);
}

// --- Main component ---

export function CalculatorApp() {
	const [state, dispatch] = useReducer(calculatorReducer, INITIAL_STATE);

	const handleDigit = useCallback((d: string) => dispatch({ type: 'DIGIT', digit: d }), []);
	const handleDecimal = useCallback(() => dispatch({ type: 'DECIMAL' }), []);
	const handleOperator = useCallback((op: Operator) => dispatch({ type: 'OPERATOR', operator: op }), []);
	const handleEquals = useCallback(() => dispatch({ type: 'EQUALS' }), []);
	const handleClear = useCallback(() => dispatch({ type: 'CLEAR' }), []);
	const handleBackspace = useCallback(() => dispatch({ type: 'BACKSPACE' }), []);
	const handleNegate = useCallback(() => dispatch({ type: 'NEGATE' }), []);

	// Keyboard support
	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (e.metaKey || e.ctrlKey || e.altKey) return;
			if ('0123456789'.includes(e.key)) { dispatch({ type: 'DIGIT', digit: e.key }); return; }
			if (e.key === '.') { dispatch({ type: 'DECIMAL' }); return; }
			if (e.key === '+') { dispatch({ type: 'OPERATOR', operator: '+' }); return; }
			if (e.key === '-') { dispatch({ type: 'OPERATOR', operator: '-' }); return; }
			if (e.key === '*') { dispatch({ type: 'OPERATOR', operator: '×' }); return; }
			if (e.key === '/') { e.preventDefault(); dispatch({ type: 'OPERATOR', operator: '÷' }); return; }
			if (e.key === '%') { dispatch({ type: 'OPERATOR', operator: '%' }); return; }
			if (e.key === 'Enter' || e.key === '=') { dispatch({ type: 'EQUALS' }); return; }
			if (e.key === 'Escape') { dispatch({ type: 'CLEAR' }); return; }
			if (e.key === 'Backspace') { dispatch({ type: 'BACKSPACE' }); return; }
		}
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, []);

	const operatorLabel = state.operator ?? '';

	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				height: '100%',
				padding: '0.75rem',
				gap: '0.5rem',
				boxSizing: 'border-box',
			}}
		>
			{/* Display */}
			<div
				style={{
					background: 'rgba(0,0,0,0.35)',
					borderRadius: '0.625rem',
					padding: '0.75rem 1rem',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'flex-end',
					gap: '0.25rem',
					minHeight: '5rem',
					flexShrink: 0,
					boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.4)',
				}}
			>
				{/* Sub-display: previous operand + operator */}
				<div
					style={{
						fontFamily: 'monospace',
						fontSize: '0.75rem',
						color: 'var(--text-secondary)',
						minHeight: '1rem',
					}}
				>
					{state.operand1 !== null ? `${state.operand1} ${operatorLabel}` : ''}
				</div>
				{/* Main display */}
				<div
					data-testid="calc-display"
					style={{
						fontFamily: 'monospace',
						fontSize: state.display.length > 9 ? '1.4rem' : '2rem',
						fontWeight: 600,
						color: state.display === 'Error' ? 'var(--accent-red, #f87171)' : 'var(--text-primary)',
						letterSpacing: '0.02em',
						textAlign: 'right',
						wordBreak: 'break-all',
					}}
				>
					{state.display}
				</div>
			</div>

			{/* Button grid: 4 columns × 5 rows */}
			<div
				style={{
					display: 'grid',
					gridTemplateColumns: 'repeat(4, 1fr)',
					gap: '0.4rem',
					flex: 1,
				}}
			>
				{/* Row 1 */}
				<CalcButton label="C" variant="clear" onClick={handleClear} />
				<CalcButton label="+/-" variant="utility" onClick={handleNegate} />
				<CalcButton label="%" variant="operator" onClick={() => handleOperator('%')} />
				<CalcButton label="÷" variant="operator" onClick={() => handleOperator('÷')} />

				{/* Row 2 */}
				<CalcButton label="7" variant="number" onClick={() => handleDigit('7')} />
				<CalcButton label="8" variant="number" onClick={() => handleDigit('8')} />
				<CalcButton label="9" variant="number" onClick={() => handleDigit('9')} />
				<CalcButton label="×" variant="operator" onClick={() => handleOperator('×')} />

				{/* Row 3 */}
				<CalcButton label="4" variant="number" onClick={() => handleDigit('4')} />
				<CalcButton label="5" variant="number" onClick={() => handleDigit('5')} />
				<CalcButton label="6" variant="number" onClick={() => handleDigit('6')} />
				<CalcButton label="-" variant="operator" onClick={() => handleOperator('-')} />

				{/* Row 4 */}
				<CalcButton label="1" variant="number" onClick={() => handleDigit('1')} />
				<CalcButton label="2" variant="number" onClick={() => handleDigit('2')} />
				<CalcButton label="3" variant="number" onClick={() => handleDigit('3')} />
				<CalcButton label="+" variant="operator" onClick={() => handleOperator('+')} />

				{/* Row 5 */}
				<CalcButton label="⌫" variant="utility" onClick={handleBackspace} />
				<CalcButton label="0" variant="number" onClick={() => handleDigit('0')} />
				<CalcButton label="." variant="number" onClick={handleDecimal} />
				<CalcButton label="=" variant="equals" onClick={handleEquals} />
			</div>
		</div>
	);
}
