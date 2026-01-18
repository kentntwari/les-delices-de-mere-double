<script lang="ts" setup>
  import { READ_ONLY_USER_STATUS } from "~/app.keys";
  import { nextTick } from "vue";

  const emit = defineEmits<{
    (e: "create", v: TCreateItemSchema): void;
    (e: "commit", v: TCreateItemSchema): void;
    (e: "error"): void;
    (e: "success"): void;
  }>();

  const userStatus = useState<IUserMeta["status"]>(READ_ONLY_USER_STATUS);

  const validationSchema = toTypedSchema(createItemSchema);

  const isOpen = ref(false);
</script>
<template>
  <UIPopover v-model:open="isOpen">
    <UIPopoverTrigger as-child>
      <UIButton :disabled="userStatus !== 'APPROVED'">
        {{ $t("components.button.create-new") }}
      </UIButton>
    </UIPopoverTrigger>
    <UIPopoverContent
      :align="'end'"
      :side-offset="-18"
      class="min-w-100 min-h-72 p-[25px] flex flex-col gap-y-4"
    >
      <header>
        <p>Menu Item</p>
      </header>
      <Form
        :validation-schema="validationSchema"
        v-slot="{ handleSubmit, isSubmitting, validate }"
        class="flex flex-col gap-y-2"
        as="div"
      >
        <form
          @submit.prevent="
            handleSubmit(async (v) => {
              // Emit create first so parent can apply optimistic update,
              // then wait a tick before emitting commit so parent state updates
              console.log('Create.vue: submit values', v);
              emit('create', {
                id: v.id,
                title: v.title,
                unitPrice: parseFloat(v.unitPrice),
              } satisfies TCreateItemSchema);
              isOpen = false;
              await nextTick();
              emit('commit', {
                id: v.id,
                title: v.title,
                unitPrice: parseFloat(v.unitPrice),
              } satisfies TCreateItemSchema);
            })
          "
          class="contents"
        >
          <Field name="title" v-slot="{ field }">
            <UIFormInput
              v-bind="field"
              :label="$t('components.menu.form.label')"
              :title="$t('components.menu.form.title')"
              placeholder="e.g: Pondu au poisson"
            />
            <ErrorMessage name="title" class="text-xs text-red-700" />
          </Field>
          <Field
            :validate-on-model-update="false"
            name="unitPrice"
            v-slot="{ field }"
          >
            <UIFloatNumeric
              v-bind="field"
              label="Unit price"
              title="Price for one item"
              placeholder="15 or 15.00"
              autocomplete="off"
            />
            <ErrorMessage name="unitPrice" class="text-xs text-red-700" />
          </Field>

          <UIButton
            type="submit"
            class="mt-4 disabled:text-red-700"
            :disabled="isSubmitting"
          >
            {{ $t("components.menu.form.submit-button") }}
          </UIButton>
        </form>
      </Form>
    </UIPopoverContent>
  </UIPopover>
</template>
