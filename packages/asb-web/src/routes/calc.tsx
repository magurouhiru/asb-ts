import type { Key } from "@heroui/react";
import {
  Alert,
  Autocomplete,
  Chip,
  Description,
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
  StatsNames,
} from "asb-ts";
import { useEffect, useState } from "react";
import * as v from "valibot";

const MODE_LIST = ["value->level", "level->value"] as const;

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
    level: v.fallback(v.number(), 0),
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
  const { mode, type, n, h, s, o, f, w, m, t, i, level } = Route.useSearch();

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
    totalLevel: level,

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
      form.setFieldValue("tameEffectiveness", opcl.tameEffectiveness, {
        dontValidate: true,
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
      {form.state.values.mode === "value->level" &&
        form.state.values.type === "dom" &&
        opcl?.status === "success" &&
        StatsNames.reduce(
          (acc, sn) => acc + opcl.levels[sn].mut + opcl.levels[sn].dom,
          0,
        ) !== 0 && (
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
            onChange={(e) => field.setValue(e as Type)}
            name="mode"
            orientation="horizontal"
            className="gap-y-1"
          >
            <Label className="w-full">type</Label>
            {Types.map((v) => (
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
              {meta?.totalLevelDiff && (
                <ErrorMessage>{toDiffStr(meta?.totalLevelDiff)}</ErrorMessage>
              )}
            </NumberField.Group>
          </field.NumberField>
        )}
      </form.AppField>

      {DISPLAY_STATS_NAME_LIST.map((sn) => {
        const tmp = meta?.statsMeta[sn]?.valueDiff ?? 0;
        const diff = toDiffStr(tmp, sn);
        return (
          <div key={sn}>
            <div className="flex gap-2">
              <Label className="col-span-full">{sn}</Label>
              {meta?.statsMeta[sn]?.hasMissingStatsForCalculation && (
                <ErrorMessage>
                  計算に必要な値がないので計算できませんでした
                </ErrorMessage>
              )}
            </div>
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
                      {diff && <ErrorMessage>{diff}</ErrorMessage>}
                    </field.NumberField>
                  )}
                </form.AppField>
              </div>

              <div className="grow">
                <div className="flex gap-x-1">
                  <div className="flex-1 grow">
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
                            <NumberField.DecrementButton className="max-sm:hidden" />
                            <NumberField.Input />
                            <NumberField.IncrementButton className="max-sm:hidden" />
                          </NumberField.Group>
                        </field.NumberField>
                      )}
                    </form.AppField>
                  </div>
                  <div className="flex-1 grow">
                    <form.AppField name={`levels.${sn}.mut`}>
                      {(field) => (
                        <field.NumberField
                          defaultValue={
                            field.form.options.defaultValues?.levels[sn].mut
                          }
                          value={field.state.value}
                          onChange={(e) => field.setValue(e)}
                          isDisabled={
                            field.form.state.values.mode === "value->level" ||
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
                          {meta?.statsMeta[sn]?.equalWildMutationRates && (
                            <Description>
                              野生と上昇率が同じ
                              <br />
                              {field.form.state.values.mode ===
                                "value->level" &&
                                "野生と区別付かないので、野生にまとめてます"}
                            </Description>
                          )}
                          {meta?.statsMeta[sn]?.isMutLevelCalculatedAsZero && (
                            <Description>0として計算</Description>
                          )}
                        </field.NumberField>
                      )}
                    </form.AppField>
                  </div>
                  <div className="flex-1 grow">
                    <form.AppField name={`levels.${sn}.dom`}>
                      {(field) => (
                        <field.NumberField
                          defaultValue={
                            field.form.options.defaultValues?.levels[sn].dom
                          }
                          value={field.state.value}
                          onChange={(e) => field.setValue(e)}
                          isDisabled={
                            field.form.state.values.mode === "value->level" ||
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
                          {meta?.statsMeta[sn]?.isDomLevelCalculatedAsZero && (
                            <Description>0として計算</Description>
                          )}
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
            {meta?.isTameEffectivenessCalculatedAsZero && (
              <Description>0%として計算</Description>
            )}
            {meta?.isTameEffectivenessCalculatedAsOne && (
              <Description>100%として計算</Description>
            )}
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
            {meta?.isImprintingCalculatedAsZero && (
              <Description>0%として計算</Description>
            )}
          </field.NumberField>
        )}
      </form.AppField>
    </form>
  );
}

function toDiffStr(n: number, sn?: StatsName): string | undefined {
  const sign = n >= 0 ? "+" : "-";
  const value = (
    sn === "meleeDamageMultiplier" ? Math.abs(n * 100) : Math.abs(n)
  ).toFixed(1);
  return n === 0
    ? undefined
    : `diff: ${sign} ${value} ${sn === "meleeDamageMultiplier" ? "%" : ""}`;
}
