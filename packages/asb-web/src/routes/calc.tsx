import type { Key } from "@heroui/react";
import {
  Alert,
  Autocomplete,
  Chip,
  EmptyState,
  ErrorMessage,
  FieldError,
  Label,
  ListBox,
  NumberField,
  Radio,
  RadioGroup,
  SearchField,
  useFilter,
} from "@heroui/react";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { createFileRoute } from "@tanstack/react-router";
import {
  calculateLevel,
  calculateValue,
  createSettings,
  createSpeciesList,
  type Levels,
  type Meta,
  type OutputOfCalculateLevel,
  type OutputOfCalculateValue,
  type OutputPackFailure,
  type StatsName,
  searchBP,
  type Type,
  Types,
  type Values,
} from "asb-ts";
import { useEffect, useState } from "react";
import * as v from "valibot";

const MODE_LIST = ["value->level", "level->value"] as const;
type Mode = (typeof MODE_LIST)[number];

const DISPLAY_STATS_NAME_LIST = [
  "health",
  "stamina",
  "oxygen",
  "food",

  // "water",
  // "temperature",
  "weight",
  "meleeDamageMultiplier",

  // "speedMultiplier",
  // "temperatureFortitude",
  // "craftingSpeedMultiplier",
  "torpidity",
] satisfies StatsName[];

const searchSchema = v.pipe(
  v.object({
    mode: v.fallback(v.picklist(MODE_LIST), "value->level"),
    type: v.fallback(v.picklist(Types), "wild"),
    n: v.fallback(v.string(), ""),
    h: v.fallback(v.number(), 0),
    s: v.fallback(v.number(), 0),
    o: v.fallback(v.number(), 0),
    f: v.fallback(v.number(), 0),
    w: v.fallback(v.number(), 0),
    m: v.fallback(v.number(), 0),
    t: v.fallback(v.number(), 0),
    i: v.fallback(v.number(), 0),
  }),
);

export const Route = createFileRoute("/calc")({
  component: CalcComponent,
  validateSearch: searchSchema,
});

const { fieldContext, formContext } = createFormHookContexts();

const { useAppForm } = createFormHook({
  fieldComponents: {
    Autocomplete,
    NumberField,
    RadioGroup,
  },
  formComponents: {},
  fieldContext,
  formContext,
});

function CalcComponent() {
  const { mode, type, n, h, s, o, f, w, m, t, i } = Route.useSearch();

  const settings = createSettings();
  const speciesList = createSpeciesList(settings);

  const [opcl, setOpcl] = useState<OutputOfCalculateLevel | null>(null);
  const [opcv, setOpcv] = useState<OutputOfCalculateValue | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);

  const defaultValues = {
    // 共通的なもの
    mode: mode,
    type,
    bp: n ? searchBP(speciesList, n, settings) : "",
    tameEffectiveness: 0,
    imprinting: i,

    // 値
    values: {
      health: h,
      stamina: s,
      oxygen: o,
      food: f,

      water: 0, // 無視
      temperature: 0, // 無視
      weight: w,
      meleeDamageMultiplier: m,

      speedMultiplier: 0, // 無視
      temperatureFortitude: 0, // 無視
      craftingSpeedMultiplier: 0, // 無視
      torpidity: t,
    } satisfies Values,

    // レベル
    levels: {
      health: { wild: 0, mut: 0, dom: 0 },
      stamina: { wild: 0, mut: 0, dom: 0 },
      oxygen: { wild: 0, mut: 0, dom: 0 },
      food: { wild: 0, mut: 0, dom: 0 },

      water: { wild: 0, mut: 0, dom: 0 }, // 無視
      temperature: { wild: 0, mut: 0, dom: 0 }, // 無視
      weight: { wild: 0, mut: 0, dom: 0 },
      meleeDamageMultiplier: { wild: 0, mut: 0, dom: 0 },

      speedMultiplier: { wild: 0, mut: 0, dom: 0 }, // 無視
      temperatureFortitude: { wild: 0, mut: 0, dom: 0 }, // 無視
      craftingSpeedMultiplier: { wild: 0, mut: 0, dom: 0 }, // 無視
      torpidity: { wild: 0, mut: 0, dom: 0 },
    } satisfies Levels,
  };

  const form = useAppForm({
    defaultValues,
    validators: {
      onMount: ({ formApi }) => {
        formApi.handleSubmit();
      },
      onChange: ({ formApi }) => {
        formApi.handleSubmit();
      },
    },
    onSubmit: ({ value }) => {
      setOpcl(null);
      setOpcv(null);
      if (!value.bp) return;
      if (value.mode === "value->level") {
        setOpcl(
          calculateLevel({
            ...value,
            speciesList,
            settings,
          }),
        );
      }
      if (value.mode === "level->value") {
        setOpcv(
          calculateValue({
            ...value,
            speciesList,
            settings,
          }),
        );
      }
    },
  });

  useEffect(() => {
    if (opcl?.status === "success") {
      Object.entries(opcl.levels).forEach(([sn, { wild, mut, dom }]) => {
        form.setFieldValue(`levels.${sn as StatsName}.wild`, wild, {
          dontValidate: true,
        });
        form.setFieldValue(`levels.${sn as StatsName}.mut`, mut, {
          dontValidate: true,
        });
        form.setFieldValue(`levels.${sn as StatsName}.dom`, dom, {
          dontValidate: true,
        });
      });
      setMeta(opcl.meta);
    }
  }, [form, opcl]);

  useEffect(() => {
    if (opcv?.status === "success") {
      Object.entries(opcv.values).forEach(([sn, value]) => {
        form.setFieldValue(`values.${sn as StatsName}`, value, {
          dontValidate: true,
        });
      });
      setMeta(opcv.meta);
    }
  }, [form, opcv]);

  const { contains } = useFilter({ sensitivity: "base" });
  const items = speciesList.map((s) => ({
    bp: s.blueprintPath as Key,
    name: s.name,
    variants: s.variants,
    mod: s.mod,
  }));

  const alert = (opf: OutputPackFailure) => (
    <Alert status="danger">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{opf.errorType}</Alert.Title>
        <Alert.Description>
          <ul>
            {opf.errors.map((e) => (
              <li key={e.path + e.message}>
                {e.path}: {e.message}
              </li>
            ))}
          </ul>
        </Alert.Description>
      </Alert.Content>
    </Alert>
  );

  return (
    <form className="grid grid-flow-row gap-1">
      {opcl?.status === "failure" && alert(opcl)}
      {opcv?.status === "failure" && alert(opcv)}

      <form.AppField name="mode">
        {(field) => (
          <field.RadioGroup
            defaultValue={field.form.options.defaultValues?.mode}
            value={field.state.value}
            onChange={(e) => field.setValue(e as Mode)}
            name="mode"
            orientation="horizontal"
            className="gap-y-1"
          >
            <Label className="w-full">mode</Label>
            <Radio value="value->level">
              <Radio.Control>
                <Radio.Indicator></Radio.Indicator>
              </Radio.Control>
              <Radio.Content>
                <Label>{"value->level"}</Label>
              </Radio.Content>
            </Radio>
            <Radio value="level->value">
              <Radio.Control>
                <Radio.Indicator></Radio.Indicator>
              </Radio.Control>
              <Radio.Content>
                <Label>{"level->value"}</Label>
              </Radio.Content>
            </Radio>
          </field.RadioGroup>
        )}
      </form.AppField>

      <form.AppField name="type">
        {(field) => (
          <field.RadioGroup
            defaultValue={field.form.options.defaultValues?.type}
            value={field.state.value}
            onChange={(e) => field.setValue(e as Type)}
            name="mode"
            orientation="horizontal"
            className="gap-y-1"
          >
            <Label className="w-full">type</Label>
            <Radio value="wild">
              <Radio.Control>
                <Radio.Indicator></Radio.Indicator>
              </Radio.Control>
              <Radio.Content>
                <Label>wild</Label>
              </Radio.Content>
            </Radio>
            <Radio value="dom">
              <Radio.Control>
                <Radio.Indicator></Radio.Indicator>
              </Radio.Control>
              <Radio.Content>
                <Label>dom</Label>
              </Radio.Content>
            </Radio>
            <Radio value="bred">
              <Radio.Control>
                <Radio.Indicator></Radio.Indicator>
              </Radio.Control>
              <Radio.Content>
                <Label>bred</Label>
              </Radio.Content>
            </Radio>
          </field.RadioGroup>
        )}
      </form.AppField>

      <form.AppField name="bp">
        {(field) => (
          <field.Autocomplete
            defaultValue={field.form.options.defaultValues?.bp}
            value={field.state.value}
            placeholder="選択してね"
            selectionMode="single"
            onChange={(key) => {
              if (typeof key === "string") {
                field.setValue(key);
              }
            }}
            aria-label="bp"
          >
            <Label>name</Label>
            <Autocomplete.Trigger>
              <Autocomplete.Value className="flex gap-2" />
              <Autocomplete.ClearButton />
              <Autocomplete.Indicator />
            </Autocomplete.Trigger>
            <Autocomplete.Popover className="w-96">
              <Autocomplete.Filter filter={contains}>
                <SearchField
                  autoFocus
                  name="search"
                  variant="secondary"
                  aria-label="search field"
                >
                  <SearchField.Group>
                    <SearchField.SearchIcon />
                    <SearchField.Input placeholder="Search..." />
                    <SearchField.ClearButton />
                  </SearchField.Group>
                </SearchField>
                <ListBox
                  aria-label="listbox"
                  className="h-96 overflow-y-auto"
                  renderEmptyState={() => (
                    <EmptyState>見つからなんだ</EmptyState>
                  )}
                >
                  {items.map((item) => (
                    <ListBox.Item
                      key={item.bp}
                      id={item.bp}
                      textValue={item.name}
                      className="flex gap-2"
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

      {DISPLAY_STATS_NAME_LIST.map((sn) => {
        const tmp = meta?.statsMeta[sn]?.valueDiff ?? 0;
        const sign = tmp >= 0 ? "+" : "-";
        const value = (
          sn === "meleeDamageMultiplier" ? Math.abs(tmp * 100) : Math.abs(tmp)
        ).toFixed(1);
        const diff =
          tmp === 0
            ? undefined
            : `diff: ${sign} ${value} ${sn === "meleeDamageMultiplier" ? "%" : ""}`;
        return (
          <div key={sn}>
            <Label className="col-span-full">{sn}</Label>
            <div className="flex flex-wrap gap-x-1 sm:flex-nowrap">
              <div className="grow">
                <form.AppField name={`values.${sn}`}>
                  {(field) => (
                    <field.NumberField
                      defaultValue={
                        field.form.options.defaultValues?.values[sn]
                      }
                      value={field.state.value}
                      onChange={(e) => field.setValue(e)}
                      isDisabled={
                        field.form.state.values.mode === "level->value"
                      }
                      minValue={0}
                      formatOptions={{
                        maximumFractionDigits: 1,
                        minimumFractionDigits: 1,
                        style:
                          sn === "meleeDamageMultiplier"
                            ? "percent"
                            : undefined,
                      }}
                    >
                      <Label>value</Label>
                      <NumberField.Group>
                        <NumberField.DecrementButton />
                        <NumberField.Input />
                        <NumberField.IncrementButton />
                      </NumberField.Group>
                      <FieldError></FieldError>
                      <ErrorMessage>{diff}</ErrorMessage>
                    </field.NumberField>
                  )}
                </form.AppField>
              </div>

              <div className="grow">
                <div className="flex gap-x-1">
                  <div className="grow">
                    <form.AppField name={`levels.${sn}.wild`}>
                      {(field) => (
                        <field.NumberField
                          defaultValue={
                            field.form.options.defaultValues?.levels[sn].wild
                          }
                          value={field.state.value}
                          onChange={(e) => field.setValue(e)}
                          isDisabled={
                            field.form.state.values.mode === "value->level"
                          }
                          minValue={0}
                          formatOptions={{
                            maximumFractionDigits: 0,
                            minimumFractionDigits: 0,
                          }}
                        >
                          <Label>wild</Label>
                          <NumberField.Group>
                            <NumberField.DecrementButton />
                            <NumberField.Input />
                            <NumberField.IncrementButton />
                          </NumberField.Group>
                        </field.NumberField>
                      )}
                    </form.AppField>
                  </div>
                  <div className="grow">
                    <form.AppField name={`levels.${sn}.mut`}>
                      {(field) => (
                        <field.NumberField
                          defaultValue={
                            field.form.options.defaultValues?.levels[sn].mut
                          }
                          value={field.state.value}
                          onChange={(e) => field.setValue(e)}
                          isDisabled
                          minValue={0}
                          formatOptions={{
                            maximumFractionDigits: 0,
                            minimumFractionDigits: 0,
                          }}
                        >
                          <Label>mut</Label>
                          <NumberField.Group>
                            <NumberField.DecrementButton />
                            <NumberField.Input />
                            <NumberField.IncrementButton />
                          </NumberField.Group>
                        </field.NumberField>
                      )}
                    </form.AppField>
                  </div>
                  <div className="grow">
                    <form.AppField name={`levels.${sn}.dom`}>
                      {(field) => (
                        <field.NumberField
                          defaultValue={
                            field.form.options.defaultValues?.levels[sn].dom
                          }
                          value={field.state.value}
                          onChange={(e) => field.setValue(e)}
                          isDisabled
                          minValue={0}
                          formatOptions={{
                            maximumFractionDigits: 0,
                            minimumFractionDigits: 0,
                          }}
                        >
                          <Label>dom</Label>
                          <NumberField.Group>
                            <NumberField.DecrementButton />
                            <NumberField.Input />
                            <NumberField.IncrementButton />
                          </NumberField.Group>
                        </field.NumberField>
                      )}
                    </form.AppField>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <form.AppField name="tameEffectiveness">
        {(field) => (
          <field.NumberField
            defaultValue={field.form.options.defaultValues?.tameEffectiveness}
            value={field.state.value}
            onChange={(e) => field.setValue(e)}
            isDisabled={field.form.state.values.mode === "value->level"}
            minValue={0}
            maxValue={1}
            formatOptions={{
              maximumFractionDigits: 0,
              minimumFractionDigits: 0,
              style: "percent",
            }}
          >
            <Label>tameEffectiveness</Label>
            <NumberField.Group>
              <NumberField.DecrementButton />
              <NumberField.Input />
              <NumberField.IncrementButton />
            </NumberField.Group>
          </field.NumberField>
        )}
      </form.AppField>

      <form.AppField name="imprinting">
        {(field) => (
          <field.NumberField
            defaultValue={field.form.options.defaultValues?.imprinting}
            value={field.state.value}
            onChange={(e) => field.setValue(e)}
            isDisabled={field.form.state.values.type !== "bred"}
            minValue={0}
            maxValue={1}
            formatOptions={{
              maximumFractionDigits: 0,
              minimumFractionDigits: 0,
              style: "percent",
            }}
          >
            <Label>imprinting</Label>
            <NumberField.Group>
              <NumberField.DecrementButton />
              <NumberField.Input />
              <NumberField.IncrementButton />
            </NumberField.Group>
          </field.NumberField>
        )}
      </form.AppField>
    </form>
  );
}
