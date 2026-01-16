<script lang="ts" setup>
  import type { GenericObject } from "vee-validate";

  import { useDebounceFn, type TCreateItemSchema } from "#imports";
  import { toast } from "vue-sonner";

  import { READ_ONLY_USER_STATUS } from "~/app.keys";
  import { MenuItemEntity } from "~~/mvc/entities/item";

  const emit = defineEmits<{
    (e: "created", v: TCreateItemSchema): void;
  }>();

  const props = defineProps<{
    onSuccess?: () => void;
    onError?: () => void;
  }>();

  const userStatus = useState<IUserMeta["status"]>(READ_ONLY_USER_STATUS);

  const validationSchema = toTypedSchema(createItemSchema);

  const isOpen = ref(false);

  const debouncedSubmit = useDebounceFn((v: GenericObject) => {
    return $fetch("/api/item", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: v,
      onRequestError() {
        props.onError?.();
      },
      onResponse() {
        props.onSuccess?.();
      },
      onResponseError() {
        props.onError?.();
      },
    });
  }, 500);
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
          @submit="
            handleSubmit($event, async (v) => {
              validate();
              emit('created', {
                id: v.id,
                title: v.title,
                unitPrice: parseFloat(v.unitPrice),
              } satisfies TCreateItemSchema);
              isOpen = false;
              toast.promise(
                debouncedSubmit({ ...v, id: MenuItemEntity.generateID() }),
                {
                  loading: 'Loading...',
                  success: 'Item created successfully!',
                  error: 'An error occurred while creating the item.',
                }
              );
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
