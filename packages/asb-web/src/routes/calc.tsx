import type { Key } from "@heroui/react";
import {
  Accordion,
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
  Switch,
  useFilter,
} from "@heroui/react";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { createFileRoute } from "@tanstack/react-router";
import {
  type ASBTSErrorObject,
  type CalculateLevelOutputPack,
  type CalculateValueOutputPack,
  calculateLevel,
  calculateValue,
  createSettings,
  createSpeciesList,
  STAT_LABELS,
  STATS_TYPES,
  type StatLabel,
  type StatLevelsUnsafe,
  type StatsType,
  type StatValuesUnsafe,
} from "asb-ts";
import { searchSpecies } from "asb-ts/dist/asb/species";
import { useEffect, useState } from "react";
import * as R from "remeda";
import * as v from "valibot";

const MODE_LIST = ["value->level", "level->value"] as const;

const DISPLAY_STAT_LABEL_LIST = [
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
] satisfies StatLabel[];

const toTrue = ["true", "True", "TRUE", "1", "on", "On", "ON"];
const searchSchema = v.pipe(
  v.object({
    mode: v.fallback(v.picklist(MODE_LIST), "value->level"),
    type: v.fallback(v.picklist(STATS_TYPES), "wild"),
    n: v.fallback(v.string(), ""),

    h: v.fallback(v.number(), 0),
    s: v.fallback(v.number(), 0),
    o: v.fallback(v.number(), 0),
    f: v.fallback(v.number(), 0),

    wtr: v.fallback(v.number(), 0),
    temp: v.fallback(v.number(), 0),
    w: v.fallback(v.number(), 0),
    m: v.fallback(v.number(), 0),

    spd: v.fallback(v.number(), 0),
    tempf: v.fallback(v.number(), 0),
    crft: v.fallback(v.number(), 0),
    t: v.fallback(v.number(), 0),

    i: v.fallback(v.number(), 0),
    level: v.fallback(v.number(), 0),
    withDom: v.fallback(
      v.pipe(
        v.string(),
        v.transform((input) => toTrue.includes(input)),
      ),
      false,
    ),
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
    Switch,
  },
  formComponents: {},
  fieldContext,
  formContext,
});

function CalcComponent() {
  const {
    mode,
    type,
    n,

    h,
    s,
    o,
    f,

    wtr,
    temp,
    w,
    m,

    spd,
    tempf,
    crft,
    t,

    i,
    level,
    withDom,
  } = Route.useSearch();

  const settings = createSettings();
  const speciesList = createSpeciesList(settings);

  const [clop, setClop] = useState<CalculateLevelOutputPack | null>(null);
  const [cvop, setCvop] = useState<CalculateValueOutputPack | null>(null);
  const [error, setError] = useState<ASBTSErrorObject | null>(null);

  const defaultValues = {
    // 共通的なもの
    mode: mode,
    type,
    bp: n ? searchSpecies(speciesList, n, settings).blueprintPath : "",
    tameEffectiveness: 0,
    imprinting: i,
    totalLevel: level,
    withDom,

    // 値
    values: {
      health: h,
      stamina: s,
      oxygen: o,
      food: f,

      water: wtr,
      temperature: temp,
      weight: w,
      meleeDamageMultiplier: m,

      speedMultiplier: spd,
      temperatureFortitude: tempf,
      craftingSpeedMultiplier: crft,
      torpidity: t,
    } satisfies StatValuesUnsafe,

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
    } satisfies StatLevelsUnsafe,
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
      setClop(null);
      setCvop(null);
      setError(null);
      if (!value.bp) return;
      const species = speciesList.find((s) => s.blueprintPath === value.bp);
      if (!species) return;
      if (value.mode === "value->level") {
        const result = calculateLevel({
          ...value,
          species,
          settings,
        });
        if (result.isSuccess) {
          setClop(result.result);
        } else {
          setError(result.error);
        }
      }
      if (value.mode === "level->value") {
        const result = calculateValue({
          ...value,
          species,
          settings,
        });
        if (result.isSuccess) {
          setCvop(result.result);
        } else {
          setError(result.error);
        }
      }
    },
  });

  useEffect(() => {
    if (clop !== null) {
      Object.entries(clop.levels).forEach(([sl, { wild, mut, dom }]) => {
        form.setFieldValue(`levels.${sl as StatLabel}.wild`, wild, {
          dontValidate: true,
        });
        form.setFieldValue(`levels.${sl as StatLabel}.mut`, mut, {
          dontValidate: true,
        });
        form.setFieldValue(`levels.${sl as StatLabel}.dom`, dom, {
          dontValidate: true,
        });
      });
      form.setFieldValue("tameEffectiveness", clop.tameEffectiveness, {
        dontValidate: true,
      });
    }
  }, [form, clop]);

  useEffect(() => {
    if (cvop !== null) {
      Object.entries(cvop.values).forEach(([sl, value]) => {
        form.setFieldValue(`values.${sl as StatLabel}`, value, {
          dontValidate: true,
        });
      });
    }
  }, [form, cvop]);

  const { contains } = useFilter({ sensitivity: "base" });
  const items = speciesList.map((s) => ({
    bp: s.blueprintPath as Key,
    name: s.name,
    variants: s.variants,
    mod: s.mod,
  }));

  const alert = (error: ASBTSErrorObject) => (
    <Alert status="danger">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{error.type}</Alert.Title>
        <Alert.Description>
          <div>{JSON.stringify(error, null, 2)}</div>
        </Alert.Description>
      </Alert.Content>
    </Alert>
  );

  return (
    <form className="grid grid-flow-row gap-1">
      {error !== null && alert(error)}
      {form.state.values.mode === "value->level" &&
        form.state.values.type === "dom" &&
        clop !== null &&
        R.values(clop.levels).reduce((acc, ld) => acc + ld.mut + ld.dom, 0) !==
          0 && (
          <Alert status="warning">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>mut,domが出るときはちょっとあれかも</Alert.Title>
              <Alert.Description>
                画像からだと値が荒いのでテイム効果がうまく計算できないので、ずれることがある。そのうち治るといいですね。
              </Alert.Description>
            </Alert.Content>
          </Alert>
        )}

      <form.AppField name="mode">
        {(field) => (
          <field.RadioGroup
            defaultValue={field.form.options.defaultValues?.mode}
            value={field.state.value}
            name="mode"
            orientation="horizontal"
            className="gap-y-1"
          >
            <Label className="w-full">mode</Label>
            {MODE_LIST.map((v) => (
              <Radio
                key={v}
                value={v}
                onClick={() => {
                  field.setValue(v);
                }}
              >
                <Radio.Control>
                  <Radio.Indicator></Radio.Indicator>
                </Radio.Control>
                <Radio.Content>
                  <Label>{v}</Label>
                </Radio.Content>
              </Radio>
            ))}
          </field.RadioGroup>
        )}
      </form.AppField>

      <form.AppField name="type">
        {(field) => (
          <field.RadioGroup
            defaultValue={field.form.options.defaultValues?.type}
            value={field.state.value}
            onChange={(e) => field.setValue(e as StatsType)}
            name="mode"
            orientation="horizontal"
            className="gap-y-1"
          >
            <Label className="w-full">type</Label>
            {STATS_TYPES.map((v) => (
              <Radio
                key={v}
                value={v}
                onClick={() => {
                  field.setValue(v);
                }}
              >
                <Radio.Control>
                  <Radio.Indicator></Radio.Indicator>
                </Radio.Control>
                <Radio.Content>
                  <Label>{v}</Label>
                </Radio.Content>
              </Radio>
            ))}
          </field.RadioGroup>
        )}
      </form.AppField>

      <Label htmlFor="withDom">withDom</Label>
      <form.AppField name="withDom">
        {(field) => (
          <field.Switch
            id="withDom"
            defaultSelected={field.form.options.defaultValues?.withDom}
            onChange={(e) => field.setValue(e)}
            name="withDom"
          >
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
            <Switch.Content>
              <Label />
            </Switch.Content>
          </field.Switch>
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

      <form.AppField name="totalLevel">
        {(field) => (
          <field.NumberField
            defaultValue={field.form.options.defaultValues?.totalLevel}
            value={field.state.value}
            onChange={(e) => field.setValue(e)}
            isDisabled={field.form.state.values.mode !== "value->level"}
            minValue={0}
            maxValue={500}
            formatOptions={{
              maximumFractionDigits: 0,
              minimumFractionDigits: 0,
            }}
          >
            <Label>totalLevel</Label>
            <NumberField.Group>
              <NumberField.DecrementButton />
              <NumberField.Input />
              <NumberField.IncrementButton />
            </NumberField.Group>
          </field.NumberField>
        )}
      </form.AppField>

      <Accordion
        allowsMultipleExpanded
        className="w-full"
        defaultExpandedKeys={DISPLAY_STAT_LABEL_LIST}
      >
        {STAT_LABELS.map((sl) => {
          const tmp = clop !== null ? (clop.diffs[sl] ?? 0) : 0;
          const diff = toDiffStr(tmp, sl);
          return (
            <Accordion.Item key={sl} id={sl}>
              <Accordion.Heading>
                <Accordion.Trigger className="p-0">
                  <div className="flex gap-2">
                    <Label>{sl}</Label>
                  </div>
                  <Accordion.Indicator />
                </Accordion.Trigger>
              </Accordion.Heading>
              <Accordion.Panel>
                <Accordion.Panel>
                  <div className="grid grid-cols-1 gap-x-1 px-0.5 pb-1 sm:grid-cols-3">
                    <div className="col-span-1 grow">
                      <form.AppField name={`values.${sl}`}>
                        {(field) => (
                          <field.NumberField
                            defaultValue={
                              field.form.options.defaultValues?.values[sl]
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
                                sl === "meleeDamageMultiplier"
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
                            {diff && <ErrorMessage>{diff}</ErrorMessage>}
                          </field.NumberField>
                        )}
                      </form.AppField>
                    </div>

                    <div className="col-span-2">
                      <div className="flex gap-x-1">
                        <div className="flex-1 grow">
                          <form.AppField name={`levels.${sl}.wild`}>
                            {(field) => (
                              <field.NumberField
                                defaultValue={
                                  field.form.options.defaultValues?.levels[sl]
                                    .wild
                                }
                                value={field.state.value}
                                onChange={(e) => field.setValue(e)}
                                isDisabled={
                                  field.form.state.values.mode ===
                                  "value->level"
                                }
                                minValue={0}
                                formatOptions={{
                                  maximumFractionDigits: 0,
                                  minimumFractionDigits: 0,
                                }}
                              >
                                <Label>wild</Label>
                                <NumberField.Group>
                                  <NumberField.DecrementButton className="max-sm:hidden" />
                                  <NumberField.Input />
                                  <NumberField.IncrementButton className="max-sm:hidden" />
                                </NumberField.Group>
                              </field.NumberField>
                            )}
                          </form.AppField>
                        </div>
                        <div className="flex-1 grow">
                          <form.AppField name={`levels.${sl}.mut`}>
                            {(field) => (
                              <field.NumberField
                                defaultValue={
                                  field.form.options.defaultValues?.levels[sl]
                                    .mut
                                }
                                value={field.state.value}
                                onChange={(e) => field.setValue(e)}
                                isDisabled={
                                  field.form.state.values.mode ===
                                    "value->level" ||
                                  field.form.state.values.type === "wild" ||
                                  field.form.state.values.type === "dom"
                                }
                                minValue={0}
                                formatOptions={{
                                  maximumFractionDigits: 0,
                                  minimumFractionDigits: 0,
                                }}
                              >
                                <Label>mut</Label>
                                <NumberField.Group>
                                  <NumberField.DecrementButton className="max-sm:hidden" />
                                  <NumberField.Input />
                                  <NumberField.IncrementButton className="max-sm:hidden" />
                                </NumberField.Group>
                              </field.NumberField>
                            )}
                          </form.AppField>
                        </div>
                        <div className="flex-1 grow">
                          <form.AppField name={`levels.${sl}.dom`}>
                            {(field) => (
                              <field.NumberField
                                defaultValue={
                                  field.form.options.defaultValues?.levels[sl]
                                    .dom
                                }
                                value={field.state.value}
                                onChange={(e) => field.setValue(e)}
                                isDisabled={
                                  field.form.state.values.mode ===
                                    "value->level" ||
                                  field.form.state.values.type === "wild"
                                }
                                minValue={0}
                                formatOptions={{
                                  maximumFractionDigits: 0,
                                  minimumFractionDigits: 0,
                                }}
                              >
                                <Label>dom</Label>
                                <NumberField.Group>
                                  <NumberField.DecrementButton className="max-sm:hidden" />
                                  <NumberField.Input />
                                  <NumberField.IncrementButton className="max-sm:hidden" />
                                </NumberField.Group>
                              </field.NumberField>
                            )}
                          </form.AppField>
                        </div>
                      </div>
                    </div>
                  </div>
                </Accordion.Panel>
              </Accordion.Panel>
            </Accordion.Item>
          );
        })}
      </Accordion>

      <form.AppField name="tameEffectiveness">
        {(field) => (
          <field.NumberField
            defaultValue={field.form.options.defaultValues?.tameEffectiveness}
            value={field.state.value}
            onChange={(e) => field.setValue(e)}
            isDisabled={
              field.form.state.values.mode === "value->level" ||
              (field.form.state.values.mode === "level->value" &&
                field.form.state.values.type !== "dom")
            }
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

function toDiffStr(n: number, sl?: StatLabel): string | undefined {
  const sign = n >= 0 ? "+" : "-";
  const value = (
    sl === "meleeDamageMultiplier" ? Math.abs(n * 100) : Math.abs(n)
  ).toFixed(1);
  return n === 0
    ? undefined
    : `diff: ${sign} ${value} ${sl === "meleeDamageMultiplier" ? "%" : ""}`;
}
