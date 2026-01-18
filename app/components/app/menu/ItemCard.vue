<script lang="ts" setup>
  import type {
    GenericObject,
    SubmissionHandler,
    FormValidationResult,
  } from "vee-validate";

  defineOptions({
    inheritAttrs: false,
  });

  const props = defineProps<{
    item: TMenuSchema["items"][number];
  }>();

  const emits = defineEmits<{
    (
      e: "update",
      intent: TUpdateItemIntents,
      v: Partial<TUpdateItemSchema>,
    ): void;
    (
      e: "commit",
      intent: TUpdateItemIntents,
      v: Partial<TUpdateItemSchema>,
    ): void;
    (e: "error", id: string, reason: string): void;
    (e: "success"): void;
  }>();

  const edit = {
    isTitle: ref(false),
    isPricing: ref(false),
    confirmTitle: () => (edit.isTitle.value = true),
    confirmPricing: () => (edit.isPricing.value = true),
    revertToDefaultTitleState: () => (edit.isTitle.value = false),
    revertToDefaultPricingState: () => (edit.isPricing.value = false),
  };

  const { isInputUnfocusable: isItemTitleUnfocusable } = useFocusInput(
    edit.isTitle,
    "item-title",
  );

  useFocusInput(edit.isPricing, "item-pricing");

  async function submitForm(
    i: TUpdateItemIntents,
    v: GenericObject,
    validate: (
      ...args: any
    ) => Promise<FormValidationResult<GenericObject, GenericObject>>,
    fn: (
      onSubmit: SubmissionHandler<GenericObject, GenericObject, unknown>,
      onInvalid?: SubmissionHandler<GenericObject, GenericObject, unknown>,
    ) => Promise<unknown>,
  ) {
    const { errors } = await validate();

    if (i !== "UPDATE_PRICING" && i !== "UPDATE_TITLE") return;

    if (i === "UPDATE_TITLE" && "title" in errors) {
      emits(
        "error",
        props.item.id,
        errors.title || "You must provide a valid title for the item.",
      );
      edit.revertToDefaultTitleState();
      return;
    }

    if (i === "UPDATE_PRICING" && "unitPrice" in errors) {
      emits(
        "error",
        props.item.id,
        errors.unitPrice || "You must provide a valid price for the item.",
      );
      edit.revertToDefaultPricingState();
      return;
    }

    if (i === "UPDATE_TITLE")
      emits("update", "UPDATE_TITLE", {
        id: props.item.id,
        title: v.title,
      });

    if (i === "UPDATE_PRICING")
      emits("update", "UPDATE_PRICING", {
        id: props.item.id,
        unitPrice: v.unitPrice,
      });

    const submitHandler: any = fn((submittedValues) => {
      console.log(
        "Submitting edit for item title...",
        JSON.stringify(submittedValues),
      );
      emits("commit", i, {
        ...submittedValues,
        title: i !== "UPDATE_TITLE" ? props.item.title : submittedValues.title,
        unitPrice:
          i !== "UPDATE_PRICING"
            ? props.item.unitPrice
            : submittedValues.unitPrice,
      });
    });

    await submitHandler;

    await nextTick();

    if (i === "UPDATE_TITLE") edit.revertToDefaultTitleState();
    if (i === "UPDATE_PRICING") edit.revertToDefaultPricingState();
  }
</script>
<template>
  <UIContextMenu>
    <UIContextMenuTrigger>
      <article
        :class="
          cn(
            'max-w-100 px-4 py-3 space-y-6 bg-secondary-200 border border-secondary-200 rounded-xl cursor-pointer',
            $attrs.class || '',
          )
        "
        :title="props.item.title"
      >
        <header class="block text-base text-neutral-grey-1000 uppercase">
          #{{ props.item.id }}
        </header>
        <footer class="flex flex-col gap-4">
          <p
            v-if="!edit.isTitle.value"
            class="truncate text-xl text-primary-1300 font-medium"
          >
            {{ props.item.title }}
          </p>
          <LazyForm
            v-else
            as="div"
            :validation-schema="
              toTypedSchema(updateItemSchema.pick({ id: true, title: true }))
            "
            :initial-values="{ id: props.item.id, title: props.item.title }"
            v-slot="{ handleSubmit, validate, values }"
          >
            <form @submit.prevent>
              <Field name="title" v-slot="{ field, handleChange, handleInput }">
                <input
                  v-bind="field"
                  ref="item-title"
                  class="w-full bg-white px-2 h-10 text-xl font-medium text-primary-1300 rounded-md"
                  :class="[
                    isItemTitleUnfocusable
                      ? 'outline-2 outline-secondary-500'
                      : 'outline-none',
                  ]"
                  @focusout="edit.revertToDefaultTitleState"
                  @keydown.enter.prevent="
                    submitForm('UPDATE_TITLE', values, validate, handleSubmit)
                  "
                />
              </Field>
              <small class="block w-full text-right text-2xs-regular"
                >Press enter to save changes</small
              >
            </form>
          </LazyForm>
          <small
            v-if="!edit.isPricing.value"
            class="text-base font-medium text-primary-500"
          >
            ${{ props.item.unitPrice }}
          </small>
          <LazyForm
            v-else
            as="div"
            :validation-schema="
              toTypedSchema(
                updateItemSchema.pick({ id: true, unitPrice: true }),
              )
            "
            :initial-values="{
              id: props.item.id,
              unitPrice: props.item.unitPrice,
            }"
            v-slot="{ handleSubmit, validate, values }"
          >
            <form @focusout="edit.revertToDefaultPricingState" @submit.prevent>
              <Field
                name="unitPrice"
                v-slot="{ field, handleChange, handleInput }"
              >
                <!-- TODO: Refactor component to inherit default values -->
                <UIFloatNumeric
                  v-bind="field"
                  ref="item-pricing"
                  :label="''"
                  class="max-w-20 h-10 text-xl font-medium text-primary-1300"
                  @keydown.enter.prevent="
                    submitForm('UPDATE_PRICING', values, validate, handleSubmit)
                  "
                />
              </Field>
              <small class="inline-block w-full text-2xs-regular"
                >Press enter to save changes</small
              >
            </form>
          </LazyForm>
        </footer>
      </article>
    </UIContextMenuTrigger>
    <UIContextMenuContent>
      <UIContextMenuSub>
        <UIContextMenuSubTrigger>
          {{ $t("pages.menu.item-card.context-menu.edit-item") }}
        </UIContextMenuSubTrigger>
        <UIContextMenuSubContent :side-offset="5">
          <UIContextMenuItem @select="edit.confirmTitle">
            {{ $t("pages.menu.item-card.context-menu.edit-item-title") }}
          </UIContextMenuItem>
          <UIContextMenuItem @select="edit.confirmPricing">
            {{ $t("pages.menu.item-card.context-menu.edit-item-pricing") }}
          </UIContextMenuItem>
        </UIContextMenuSubContent>
      </UIContextMenuSub>
      <UIContextMenuItem variant="destructive">
        {{ $t("pages.menu.item-card.context-menu.delete-item") }}
      </UIContextMenuItem>
    </UIContextMenuContent>
  </UIContextMenu>
</template>
