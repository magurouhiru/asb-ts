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
  calcL,
  DefaultSettings,
  getSpeciesList,
  type Levels,
  PositiveValueSchema,
  searchSpecies,
  Types,
} from "asb-ts";
import { useMemo, useState } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
} from "recharts";
import * as v from "valibot";

const searchSchema = v.pipe(
  v.object({
    type: v.fallback(v.picklist(Types), "wild"),
    n: v.fallback(v.string(), ""),
    h: v.fallback(PositiveValueSchema, 0),
    s: v.fallback(PositiveValueSchema, 0),
    o: v.fallback(PositiveValueSchema, 0),
    f: v.fallback(PositiveValueSchema, 0),
    w: v.fallback(PositiveValueSchema, 0),
    m: v.fallback(PositiveValueSchema, 0),
    t: v.fallback(PositiveValueSchema, 0),
    i: v.fallback(PositiveValueSchema, 0),
  }),
);

export const Route = createFileRoute("/calc_level")({
  component: CalcLevelComponent,
  validateSearch: searchSchema,
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

function CalcLevelComponent() {
  const { contains } = useFilter({ sensitivity: "base" });
  const [_variants, setVariants] = useState<string[]>([]);
  const [_mod, _setMod] = useState<string>("");
  const [levels, setLevels] = useState<Levels | null>(null);
  const { type, n, h, s, o, f, w, m, t, i } = Route.useSearch();
  const defaultSettings = DefaultSettings;
  const speciesList = getSpeciesList();
  const items = speciesList.map((s) => ({
    id: s.blueprintPath as Key,
    name: s.name,
    variants: s.variants,
    mod: s.mod,
  }));
  const [tameEffectiveness, setTameEffectiveness] = useState<number>(0);

  const data = useMemo(() => {
    if (!levels) return [];
    return [
      { subject: "❤", A: levels.health.wild, fullMark: 50 },
      { subject: "🏃", A: levels.stamina.wild, fullMark: 50 },
      { subject: "🏊", A: levels.oxygen.wild, fullMark: 50 },
      { subject: "🍰", A: levels.food.wild, fullMark: 50 },
      { subject: "🏋️‍♂️", A: levels.weight.wild, fullMark: 50 },
      {
        subject: "🤺",
        A: levels.meleeDamageMultiplier.wild,
        fullMark: 50,
      },
    ];
  }, [levels]);

  const defaultValues = {
    type,
    bp: searchSpecies(speciesList, n, defaultSettings)?.blueprintPath || "",
    health: h,
    stamina: s,
    oxygen: o,
    food: f,
    weight: w,
    meleeDamageMultiplier: m,
    torpidity: t,
    imprinting: i,
  };

  const updateLevels = ({ value }: { value: typeof defaultValues }) => {
    const s = speciesList.find((s) => s.blueprintPath === value.bp);
    if (!s) return;
    const r = calcL(speciesList, value);
    if (!r) return;
    setVariants(r.species.variants);
    setLevels(r.levels);
    setTameEffectiveness(r.tameEffectiveness);
  };

  const form = useAppForm({
    defaultValues,
    validators: {
      onMount: updateLevels,
      onChange: updateLevels,
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
              defaultSelectedKeys={[type]}
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
        <form.AppField name="bp">
          {(field) => (
            <field.Autocomplete
              defaultValue={field.state.value}
              placeholder="選択してね"
              selectionMode="single"
              onChange={(key) => field.setValue(key as string)}
              aria-label="name"
            >
              <Label>🦖いきものの種類</Label>
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
                        key={item.id}
                        id={item.id}
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
        <form.AppField name="health">
          {(field) => (
            <field.NumberField
              defaultValue={field.state.value}
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
                <output>
                  {levels?.health.wild}
                  {levels?.health.error ? ` ± ${levels?.health.error}` : ""}
                </output>
              </div>
            </field.NumberField>
          )}
        </form.AppField>
        <form.AppField name="stamina">
          {(field) => (
            <field.NumberField
              defaultValue={field.state.value}
              minValue={0}
              onChange={(v) => field.setValue(v)}
            >
              <Label>🏃スタミナ</Label>
              <div className="flex items-center gap-2">
                <NumberField.Group>
                  <NumberField.DecrementButton />
                  <NumberField.Input />
                  <NumberField.IncrementButton />
                </NumberField.Group>
                <output>
                  {levels?.stamina.wild}
                  {levels?.stamina.error ? ` ± ${levels.stamina.error}` : ""}
                </output>
              </div>
            </field.NumberField>
          )}
        </form.AppField>
        <form.AppField name="oxygen">
          {(field) => (
            <field.NumberField
              defaultValue={field.state.value}
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
                <output>
                  {levels?.oxygen.wild}
                  {levels?.oxygen.error ? ` ± ${levels.oxygen.error}` : ""}
                </output>
              </div>
            </field.NumberField>
          )}
        </form.AppField>
        <form.AppField name="food">
          {(field) => (
            <field.NumberField
              defaultValue={field.state.value}
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
                <output>
                  {levels?.food.wild}
                  {levels?.food.error ? ` ± ${levels.food.error}` : ""}
                </output>
              </div>
            </field.NumberField>
          )}
        </form.AppField>
        <form.AppField name="weight">
          {(field) => (
            <field.NumberField
              defaultValue={field.state.value}
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
                <output>
                  {levels?.weight.wild}
                  {levels?.weight.error ? ` ± ${levels.weight.error}` : ""}
                </output>
              </div>
            </field.NumberField>
          )}
        </form.AppField>
        <form.AppField name="meleeDamageMultiplier">
          {(field) => (
            <field.NumberField
              defaultValue={field.state.value}
              minValue={0}
              formatOptions={{ style: "percent" }}
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
                  {levels?.meleeDamageMultiplier.wild}
                  {levels?.meleeDamageMultiplier.error
                    ? ` ± ${levels.meleeDamageMultiplier.error}`
                    : ""}
                </output>
              </div>
            </field.NumberField>
          )}
        </form.AppField>
        <form.AppField name="torpidity">
          {(field) => (
            <field.NumberField
              defaultValue={field.state.value}
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
                <output>
                  {levels?.torpidity.wild}
                  {levels?.torpidity.error
                    ? ` ± ${levels.torpidity.error}`
                    : ""}
                </output>
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

        <div>
          <Label>刷り込み[%]</Label>
          <output>{`${Math.round(tameEffectiveness * 100)} %`}</output>
        </div>
      </form>

      <RadarChart
        style={{
          width: "100%",
          height: "100%",
          maxWidth: "500px",
          maxHeight: "80vh",
          aspectRatio: 1,
        }}
        responsive
        outerRadius="80%"
        data={data}
        margin={{
          top: 20,
          left: 20,
          right: 20,
          bottom: 20,
        }}
      >
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" />
        <PolarRadiusAxis angle={30} domain={[0, 50]} tickCount={6} />
        <Radar
          name="main"
          dataKey="A"
          stroke="#8884d8"
          fill="#8884d8"
          fillOpacity={0.6}
        />
      </RadarChart>
    </div>
  );
}
