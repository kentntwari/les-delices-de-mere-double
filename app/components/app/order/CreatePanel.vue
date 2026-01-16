<script lang="ts" setup>
  import { ChevronLeft, ChevronRight } from "lucide-vue-next";
  import { VisuallyHidden } from "reka-ui";

  import { READ_ONLY_USER_STATUS } from "~/app.keys";

  const { data: res } = useNuxtData<{ data: TMenuSchema }>("menu");
  const hasMenu = computed(() => {
    if (!res.value) return false;
    if (!res.value.data) return false;
    if (res.value.data.items.length === 0) return false;
    return true;
  });

  const userStatus = useState<IUserMeta["status"]>(READ_ONLY_USER_STATUS);

  const { errors, errorBag, meta, values, resetForm } = useForm({
    name: "create-order-form",
    validationSchema: toTypedSchema(createOrderFormSchema),
    initialValues: {
      items: [],
    },
  });

  const {
    steps,
    current: currentStep,
    index: currentStepIndex,
    isBefore,
  } = useStepper({
    "items-list": {
      title: "Items list",
      isValid: () =>
        createOrderFormSchema.shape.items.safeParse(values.items).success,
    },
    "customer-details": {
      title: "Customer details",
      isValid: () =>
        createOrderFormSchema.shape.cx.safeParse(values.cx).success,
    },
    "delivery-instructions": {
      title: "Delivery instructions",
      isValid: () =>
        createOrderFormSchema.shape.delivery.safeParse(values.delivery).success,
    },
    "preview-order": {
      title: "Preview",
      isValid: () =>
        steps.value["customer-details"].isValid() &&
        steps.value["items-list"].isValid() &&
        steps.value["delivery-instructions"].isValid(),
    },
  });
</script>
<template>
  <form>
    <UIDialog>
      <UIDialogTrigger as-child>
        <UIButton :disabled="userStatus !== 'APPROVED'"
          >{{ $t("components.button.create-new") }}
        </UIButton>
      </UIDialogTrigger>

      <UIDialogContent
        @interact-outside="(e) => e.preventDefault()"
        @escape-key-down="(e) => e.preventDefault()"
      >
        <UIDialogHeader>
          <UIDialogTitle>{{
            $t("components.order.create-panel.title")
          }}</UIDialogTitle>
          <UIDialogClose />
        </UIDialogHeader>

        <VisuallyHidden>
          <UIDialogDescription />
        </VisuallyHidden>

        <section v-show="!hasMenu" class="p-6 space-y-8">
          <p class="font-medium text-neutral-grey-1300">
            {{ $t("components.order.create-panel.menu.no-menu-header") }}
          </p>
          <div>
            <span class="font-regular">{{
              $t(
                "components.order.create-panel.menu.no-items",
                "No items menu found."
              )
            }}</span
            ><br />
            <span>
              {{ $t("components.order.create-panel.menu.add-item-prompt") }}
            </span>
          </div>

          <NuxtLink
            class="block uppercase text-sm text-primary-500 hover:text-primary-700"
            to="/menu"
            >{{
              $t("components.order.create-panel.menu.no-menu-link")
            }}</NuxtLink
          >
        </section>

        <section v-show="hasMenu" class="p-6 flex flex-col gap-y-8">
          <header>
            <div class="h-fit flex justify-between">
              <span
                v-for="({ title }, idx, k) in steps"
                :key="idx"
                class="flex items-center gap-x-3"
              >
                <small
                  class="size-7.5 flex items-center justify-center rounded-full"
                  :class="[
                    currentStep.title === title
                      ? 'bg-accent-one-800 text-white'
                      : 'bg-neutral-grey-400',
                  ]"
                  >{{ k + 1 }}</small
                >
                <small
                  class="inline-block text-sm font-semibold"
                  :class="[
                    currentStep.title === title
                      ? 'text-accent-one-1000'
                      : 'text-neutral-grey-900',
                  ]"
                  >{{ title }}
                </small>

                <small
                  v-if="k !== 3"
                  class="w-fit"
                  :class="[
                    isBefore(idx) && currentStep.isValid()
                      ? 'text-accent-one-800'
                      : 'text-neutral-grey-700',
                  ]"
                >
                  <ChevronRight :size="16" />
                </small>
              </span>
            </div>
          </header>
          <footer class="flex-1">
            <AppOrderCreatePanelItemsList
              name=""
              :data="values.items ?? []"
              v-if="currentStep === steps['items-list']"
            />
            <AppOrderCreatePanelCustomerDetails
              v-else-if="currentStep === steps['customer-details']"
            />

            <AppOrderCreatePanelDeliveryInstructions
              v-else-if="currentStep === steps['delivery-instructions']"
            />

            <AppOrderCreatePanelPreview v-else />
          </footer>
        </section>

        <UIDialogFooter v-show="hasMenu" class="justify-between">
          <UIButton
            v-show="currentStepIndex > 0"
            :variant="'link'"
            :class="'text-neutral-grey-1000 hover:bg-neutral-grey-300 hover:no-underline'"
          >
            <ChevronLeft :size="20" /> Go back
          </UIButton>
          <div class="space-x-2 flex-1 text-right">
            <UIButton :variant="'outline'" @click="resetForm()">
              {{ $t("components.order.create-panel.restart-button") }}
            </UIButton>
            <UIButton
              :disabled="!meta.valid"
              :variant="'primary'"
              :type="
                currentStep === steps['preview-order'] ? 'submit' : 'button'
              "
              >{{
                currentStep === steps["preview-order"]
                  ? $t("components.order.create-panel.submit-button.final")
                  : $t("components.order.create-panel.submit-button.next")
              }}</UIButton
            >
          </div>
        </UIDialogFooter>
      </UIDialogContent>
    </UIDialog>
  </form>
</template>
