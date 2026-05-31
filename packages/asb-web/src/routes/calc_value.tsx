import type { Key } from "@heroui/react";
import {
  Autocomplete,
  Chip,
  EmptyState,
  Label,
  ListBox,
  ListBoxItem,
  NumberField,
  SearchField,
  useFilter,
} from "@heroui/react";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { createFileRoute } from "@tanstack/react-router";
import {
  calculateValueController,
  DEFAULT_SETTINGS,
  getSpeciesList,
  ImprintingSchema,
  type LevelsIn,
  LevelsSchema,
  TameEffectivenessSchema,
  type Type,
  Types,
  type Values,
} from "asb-ts";
import { useState } from "react";
import * as v from "valibot";

export const Route = createFileRoute("/calc_value")({
  component: CalcValueComponent,
});

const { fieldContext, formContext } = createFormHookContexts();

const { useAppForm } = createFormHook({
  fieldComponents: {
    Autocomplete,
    NumberField,
    ListBox,
  },
  formComponents: {},
  fieldContext,
  formContext,
});

function CalcValueComponent() {
  const { contains } = useFilter({ sensitivity: "base" });
  const defaultSettings = DEFAULT_SETTINGS;
  const speciesList = getSpeciesList(defaultSettings);
  const items = speciesList.map((s) => ({
    id: s.blueprintPath as Key,
    name: s.name,
    variants: s.variants,
    mod: s.mod,
  }));
  const [values, setValues] = useState<Values | null>(null);

  const form = useAppForm({
    defaultValues: {
      name: "",
      Health_wild: 0,
      Stamina_wild: 0,
      Oxygen_wild: 0,
      Food_wild: 0,
      Weight_wild: 0,
      MeleeDamageMultiplier_wild: 0,
      Torpidity_wild: 0,
      tameEffectiveness: 0,
      imprinting: 0,
      type: "wild" as Type,
    },
    validators: {
      onChange: ({ value }) => {
        const speciesList = getSpeciesList(defaultSettings);
        const s = speciesList.find((s) => s.blueprintPath === value.name);
        if (!s) return;
        const parsed = v.safeParse(LevelsSchema, {
          health: { wild: value.Health_wild },
          stamina: { wild: value.Stamina_wild },
          oxygen: { wild: value.Oxygen_wild },
          food: { wild: value.Food_wild },
          water: { wild: 0 },
          temperature: { wild: 0 },
          weight: { wild: value.Weight_wild },
          meleeDamageMultiplier: { wild: value.MeleeDamageMultiplier_wild },
          speedMultiplier: { wild: 0 },
          temperatureFortitude: { wild: 0 },
          craftingSpeedMultiplier: { wild: 0 },
          torpidity: { wild: value.Torpidity_wild },
        } satisfies LevelsIn);
        const parsedImprinting = v.safeParse(
          ImprintingSchema,
          value.imprinting,
        );
        const parsedTameEffectiveness = v.safeParse(
          TameEffectivenessSchema,
          value.tameEffectiveness,
        );
        if (
          !parsed.success ||
          !parsedImprinting.success ||
          !parsedTameEffectiveness.success
        )
          return;
        const result = calculateValueController({
          type: value.type as Type,
          levels: parsed.output,
          tameEffectiveness: parsedTameEffectiveness.output,
          imprinting: parsedImprinting.output,
          species: s,
          settings: defaultSettings,
        });
        setValues(result);
      },
    },
  });

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <form.AppField name="type">
          {(field) => (
            <field.ListBox
              aria-label="type"
              selectionMode="single"
              defaultSelectedKeys={["wild"]}
              onSelectionChange={(key) => {
                if (key !== "all") {
                  Types.forEach((t) => {
                    if (key.has(t)) {
                      field.setValue(t);
                    }
                  });
                }
              }}
            >
              <ListBoxItem id="wild" textValue="wild">
                野生
                <ListBox.ItemIndicator />
              </ListBoxItem>
              <ListBoxItem id="dom" textValue="dom">
                テイム
                <ListBox.ItemIndicator />
              </ListBoxItem>
              <ListBoxItem id="bred" textValue="bred">
                ブリ
                <ListBox.ItemIndicator />
              </ListBoxItem>
            </field.ListBox>
          )}
        </form.AppField>

        <form.AppField name="name">
          {(field) => (
            <field.Autocomplete
              placeholder="選択してね"
              selectionMode="single"
              onChange={(key) => field.setValue(key as string)}
              aria-label="name"
            >
              <Label>🦖いきものの種類</Label>
              <Autocomplete.Trigger>
                <Autocomplete.Value />
                <Autocomplete.ClearButton />
                <Autocomplete.Indicator />
              </Autocomplete.Trigger>
              <Autocomplete.Popover>
                <Autocomplete.Filter filter={contains}>
                  <SearchField autoFocus name="search" variant="secondary">
                    <SearchField.Group>
                      <SearchField.SearchIcon />
                      <SearchField.Input placeholder="Search..." />
                      <SearchField.ClearButton />
                    </SearchField.Group>
                  </SearchField>
                  <ListBox
                    aria-label="listbox"
                    renderEmptyState={() => (
                      <EmptyState>見つからなんだ</EmptyState>
                    )}
                  >
                    {items.map((item) => (
                      <ListBox.Item
                        key={item.id}
                        id={item.id}
                        textValue={item.name}
                      >
                        {item.name}
                        {item.variants.map((v) => (
                          <Chip key={v}>{v}</Chip>
                        ))}
                        {item.mod && <Chip color="accent">{item.mod}</Chip>}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Autocomplete.Filter>
              </Autocomplete.Popover>
            </field.Autocomplete>
          )}
        </form.AppField>

        <form.AppField name="Health_wild">
          {(field) => (
            <field.NumberField
              defaultValue={0}
              minValue={0}
              onChange={(v) => field.setValue(v)}
            >
              <Label>❤体力</Label>
              <div className="flex items-center gap-2">
                <NumberField.Group>
                  <NumberField.DecrementButton />
                  <NumberField.Input />
                  <NumberField.IncrementButton />
                </NumberField.Group>
                <output>{values?.health}</output>
              </div>
            </field.NumberField>
          )}
        </form.AppField>

        <form.AppField name="Stamina_wild">
          {(field) => (
            <field.NumberField
              defaultValue={0}
              minValue={0}
              onChange={(v) => field.setValue(v)}
            >
              <Label>🚴スタミナ</Label>
              <div className="flex items-center gap-2">
                <NumberField.Group>
                  <NumberField.DecrementButton />
                  <NumberField.Input />
                  <NumberField.IncrementButton />
                </NumberField.Group>
                <output>{values?.stamina}</output>
              </div>
            </field.NumberField>
          )}
        </form.AppField>

        <form.AppField name="Oxygen_wild">
          {(field) => (
            <field.NumberField
              defaultValue={0}
              minValue={0}
              onChange={(v) => field.setValue(v)}
            >
              <Label>🏊酸素量</Label>
              <div className="flex items-center gap-2">
                <NumberField.Group>
                  <NumberField.DecrementButton />
                  <NumberField.Input />
                  <NumberField.IncrementButton />
                </NumberField.Group>
                <output>{values?.oxygen}</output>
              </div>
            </field.NumberField>
          )}
        </form.AppField>

        <form.AppField name="Food_wild">
          {(field) => (
            <field.NumberField
              defaultValue={0}
              minValue={0}
              onChange={(v) => field.setValue(v)}
            >
              <Label>🍰食料</Label>
              <div className="flex items-center gap-2">
                <NumberField.Group>
                  <NumberField.DecrementButton />
                  <NumberField.Input />
                  <NumberField.IncrementButton />
                </NumberField.Group>
                <output>{values?.food}</output>
              </div>
            </field.NumberField>
          )}
        </form.AppField>

        <form.AppField name="Weight_wild">
          {(field) => (
            <field.NumberField
              defaultValue={0}
              minValue={0}
              onChange={(v) => field.setValue(v)}
            >
              <Label>🏋️‍♂️重量</Label>
              <div className="flex items-center gap-2">
                <NumberField.Group>
                  <NumberField.DecrementButton />
                  <NumberField.Input />
                  <NumberField.IncrementButton />
                </NumberField.Group>
                <output>{values?.weight}</output>
              </div>
            </field.NumberField>
          )}
        </form.AppField>

        <form.AppField name="MeleeDamageMultiplier_wild">
          {(field) => (
            <field.NumberField
              defaultValue={0}
              minValue={0}
              onChange={(v) => field.setValue(v)}
            >
              <Label>🤺近接攻撃力[%]</Label>
              <div className="flex items-center gap-2">
                <NumberField.Group>
                  <NumberField.DecrementButton />
                  <NumberField.Input />
                  <NumberField.IncrementButton />
                </NumberField.Group>
                <output>
                  {values?.meleeDamageMultiplier
                    ? `${Math.round(values.meleeDamageMultiplier * 1000) / 10}%`
                    : ""}
                </output>
              </div>
            </field.NumberField>
          )}
        </form.AppField>

        <form.AppField name="Torpidity_wild">
          {(field) => (
            <field.NumberField
              defaultValue={0}
              minValue={0}
              onChange={(v) => field.setValue(v)}
            >
              <Label>😵‍💫気絶値</Label>
              <div className="flex items-center gap-2">
                <NumberField.Group>
                  <NumberField.DecrementButton />
                  <NumberField.Input />
                  <NumberField.IncrementButton />
                </NumberField.Group>
                <output>{values?.torpidity}</output>
              </div>
            </field.NumberField>
          )}
        </form.AppField>

        <form.AppField name="tameEffectiveness">
          {(field) => (
            <field.NumberField
              defaultValue={0}
              minValue={0}
              formatOptions={{ style: "percent" }}
              onChange={(v) => field.setValue(v)}
            >
              <Label>テイム効果[%]</Label>
              <div className="flex items-center gap-2">
                <NumberField.Group>
                  <NumberField.DecrementButton />
                  <NumberField.Input />
                  <NumberField.IncrementButton />
                </NumberField.Group>
              </div>
            </field.NumberField>
          )}
        </form.AppField>

        <form.AppField name="imprinting">
          {(field) => (
            <field.NumberField
              defaultValue={0}
              minValue={0}
              formatOptions={{ style: "percent" }}
              onChange={(v) => field.setValue(v)}
            >
              <Label>刷り込み[%]</Label>
              <div className="flex items-center gap-2">
                <NumberField.Group>
                  <NumberField.DecrementButton />
                  <NumberField.Input />
                  <NumberField.IncrementButton />
                </NumberField.Group>
              </div>
            </field.NumberField>
          )}
        </form.AppField>
      </form>
    </div>
  );
}
