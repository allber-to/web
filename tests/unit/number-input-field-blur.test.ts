import { createElement, useState } from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const company = vi.hoisted(() => ({ use_comma_as_decimal_place: false }));

vi.mock('$app/common/colors', () => ({ useColorScheme: () => ({}) }));
vi.mock('$app/common/hooks/useCurrentCompany', () => ({
  useCurrentCompany: () => company,
}));
vi.mock('$app/common/hooks/useReactSettings', () => ({
  useReactSettings: () => ({ number_precision: 2 }),
}));
vi.mock('$app/components/ErrorMessage', () => ({ ErrorMessage: () => null }));
vi.mock('$app/components/forms/InputField', () => ({ InputField: () => null }));

import { NumberInputField } from '../../src/components/forms/NumberInputField';

let renderer: ReactTestRenderer;
beforeEach(() => {
  company.use_comma_as_decimal_place = false;
  vi.useFakeTimers();
});
afterEach(() => {
  act(() => renderer?.unmount());
  vi.useRealTimers();
});

function renderField(
  changeOverride: boolean,
  entered = '10',
  initialValue = '0'
) {
  const changed = vi.fn();
  function Harness() {
    const [value, setValue] = useState(initialValue);
    const [editing, setEditing] = useState(true);
    return createElement(
      'section',
      null,
      editing &&
        createElement(NumberInputField, {
          value,
          changeOverride,
          precision: 2,
          onValueChange: (next) => {
            changed(next);
            setValue(next);
          },
        }),
      createElement('output', null, value),
      createElement('button', { onClick: () => setEditing(false) }, 'Continue')
    );
  }
  act(() => {
    renderer = create(createElement(Harness));
  });
  const target = {
    value: entered,
    selectionStart: entered.length,
    selectionEnd: entered.length,
    focus() {},
    setSelectionRange() {},
  };
  // Invoke the host input: NumericFormat's actual formatting/event chain runs.
  if (entered !== '') {
    act(() => renderer.root.findByType('input').props.onChange({ target }));
  }
  return { changed, target };
}

test.each([
  true,
  false,
])('blur commits before immediate navigation (override=%s)', (override) => {
  const { changed, target } = renderField(override);
  expect(changed).not.toHaveBeenCalled();
  act(() => renderer.root.findByType('input').props.onBlur({ target }));
  act(() => renderer.root.findByType('button').props.onClick());
  expect(renderer.root.findByType('output').children).toEqual(['10']);
  expect(changed).toHaveBeenCalledExactlyOnceWith('10');
  act(() => {
    vi.advanceTimersByTime(600);
  });
  expect(changed).toHaveBeenCalledExactlyOnceWith('10');
});

test('typing stays debounced and blur cancels the pending notification', () => {
  const { changed, target } = renderField(true);
  act(() => {
    vi.advanceTimersByTime(499);
  });
  expect(changed).not.toHaveBeenCalled();
  act(() => renderer.root.findByType('input').props.onBlur({ target }));
  expect(changed).toHaveBeenCalledExactlyOnceWith('10');
  act(() => {
    vi.advanceTimersByTime(600);
  });
  expect(changed).toHaveBeenCalledExactlyOnceWith('10');
});

test('typing without blur still commits after 500 ms', () => {
  const { changed } = renderField(true);
  act(() => {
    vi.advanceTimersByTime(500);
  });
  expect(changed).toHaveBeenCalledExactlyOnceWith('10');
});

test('unmount without blur does not commit a discarded edit', () => {
  const { changed } = renderField(true);
  act(() => renderer.root.findByType('button').props.onClick());
  act(() => {
    vi.advanceTimersByTime(600);
  });
  expect(changed).not.toHaveBeenCalled();
  expect(renderer.root.findByType('output').children).toEqual(['0']);
});

test('unchanged blur and blur after debounce do not mark the form dirty', () => {
  const { changed, target } = renderField(true, '');
  act(() => renderer.root.findByType('input').props.onBlur({ target }));
  act(() => {
    vi.advanceTimersByTime(600);
  });
  expect(changed).not.toHaveBeenCalled();
  target.value = '10';
  act(() => renderer.root.findByType('input').props.onChange({ target }));
  act(() => {
    vi.advanceTimersByTime(500);
  });
  expect(changed).toHaveBeenCalledExactlyOnceWith('10');
  act(() => renderer.root.findByType('input').props.onBlur({ target }));
  act(() => {
    vi.advanceTimersByTime(600);
  });
  expect(changed).toHaveBeenCalledExactlyOnceWith('10');
});

test('comma decimal is normalized on immediate blur', () => {
  company.use_comma_as_decimal_place = true;
  const { changed, target } = renderField(true, '10,50');
  act(() => renderer.root.findByType('input').props.onBlur({ target }));
  expect(changed).toHaveBeenCalledExactlyOnceWith('10.5');
});

test('blur without typing preserves stored precision beyond displayed decimals', () => {
  const { changed, target } = renderField(true, '', '1.2345');
  target.value = renderer.root.findByType('input').props.value;
  expect(target.value).toBe('1.23');
  act(() => renderer.root.findByType('input').props.onBlur({ target }));
  act(() => {
    vi.advanceTimersByTime(600);
  });
  expect(changed).not.toHaveBeenCalled();
  expect(renderer.root.findByType('output').children).toEqual(['1.2345']);
});

test('editing a higher precision stored value commits once on immediate blur', () => {
  const { changed, target } = renderField(true, '2', '1.2345');
  act(() => renderer.root.findByType('input').props.onBlur({ target }));
  expect(changed).toHaveBeenCalledExactlyOnceWith('2');
  act(() => {
    vi.advanceTimersByTime(600);
  });
  expect(changed).toHaveBeenCalledExactlyOnceWith('2');
  expect(renderer.root.findByType('output').children).toEqual(['2']);
});
