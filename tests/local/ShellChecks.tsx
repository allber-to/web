/** Focused fixtures for real shell overlays. No production route or write handler. */
import { useState } from 'react';
import { useSetAtom } from 'jotai';
import { preventLeavingPageAtom } from '$app/common/hooks/useAddPreventNavigationEvents';
import { Default } from '$app/components/layouts/Default';
import { Combobox } from '$app/components/forms/Combobox';
import { InputField } from '$app/components/forms';

export function ShellChecks() {
  const [draft, setDraft] = useState('');
  const [selected, setSelected] = useState('');
  const setPrevent = useSetAtom(preventLeavingPageAtom);
  return (
    <Default title="Local shell checks" breadcrumbs={[]}>
      <section data-testid="shell-checks" className="space-y-4">
        <p>Explicit local fixture: short page and unsaved draft.</p>
        <InputField
          id="fixture-draft"
          label="Fixture draft"
          value={draft}
          onValueChange={(value) => {
            setDraft(value);
            setPrevent({ prevent: Boolean(value) });
          }}
        />
        <Combobox
          inputOptions={{
            value: selected,
            label: 'Fixture selector',
            placeholder: 'Choose fixture option',
          }}
          entries={Array.from({ length: 8 }, (_, index) => ({
            id: index + 1,
            value: String(index + 1),
            label: `Fixture option ${index + 1}`,
            resource: null,
            searchable: `Fixture option ${index + 1}`,
            eventType: 'external' as const,
          }))}
          entryOptions={{ id: 'id', label: 'label', value: 'value' }}
          onChange={(entry) => setSelected(String(entry.value))}
        />
        <output data-testid="draft-state">{draft ? 'dirty' : 'clean'}</output>
        <output data-testid="selected-option">{selected}</output>
      </section>
    </Default>
  );
}
