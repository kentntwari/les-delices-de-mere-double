<script lang="ts" setup>
  import { ChevronLeft, ChevronRight } from "lucide-vue-next";
  import { VisuallyHidden } from "reka-ui";
  import { nanoid } from "nanoid";

  import {
    READ_ONLY_USER_STATUS,
    GET_MENU_ITEMS_KEY,
    GET_CUSTOMERS_KEY,
  } from "~/app.keys";

  const emits = defineEmits<{
    (e: "created", r: TCreateOrderFormSchema, v: TOrderSchema): void;
  }>();

  const { data: menuResults } = useNuxtData<{ data: TMenuSchema }>(
    GET_MENU_ITEMS_KEY,
  );

  const hasMenu = computed(() => {
    if (!menuResults.value) return false;
    if (!menuResults.value.data) return false;
    if (menuResults.value.data.items.length === 0) return false;
    return true;
  });

  const menuItemsMap = computed(() => {
    const map = new Map<string, TMenuSchema["items"][number]>();
    if (menuResults.value?.data?.items) {
      menuResults.value.data.items.forEach((item) => {
        map.set(item.id, item);
      });
    }
    return map;
  });

  const { data: customerResults } = useNuxtData<{ data: TCustomerSchema[] }>(
    GET_CUSTOMERS_KEY,
  );
  const hasCustomers = computed(() => {
    if (!customerResults.value) return false;
    if (!customerResults.value.data) return false;
    if (customerResults.value.data.length === 0) return false;
    return true;
  });

  const userStatus = useState<IUserMeta["status"]>(READ_ONLY_USER_STATUS);

  const { errors, values, resetForm, setValues, handleSubmit, isSubmitting } =
    useForm({
      name: "create-order-form",
      validationSchema: toTypedSchema(createOrderFormSchema),
      initialValues: {
        cx: undefined,
        items: [],
      },
    });

  const formItemsTotal = computed(() => {
    return (
      values.items?.reduce((acc, item) => {
        const price = item.quantity ? item.unitPrice : 0;
        return acc + price * item.quantity;
      }, 0) || 0
    );
  });

  const submitForm = handleSubmit(async (v) => {
    emits("created", v, {
      id: nanoid(),
      items: v.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        title: menuItemsMap.value.get(item.id)?.title || "",
        unitPrice: item.unitPrice,
      })),
      total: formItemsTotal.value.toString(),
    });

    await nextTick();

    dialogActions.closeDialog();
  });

  const {
    steps,
    current: currentStep,
    index: currentStepIndex,
    goTo,
    goToNext,
    goToPrevious,
  } = useStepper({
    "items-list": {
      title: "Items list",
      isValid: () => {
        const a = JSON.parse(JSON.stringify(values.items));
        return createOrderFormSchema.shape.items.safeParse(a).success;
      },
    },
    "customer-details": {
      title: "Customer details",
      isValid: () => {
        return createOrderFormSchema.shape.cx.safeParse(values.cx).success;
      },
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
  } as const);

  watch(
    [() => currentStep.value, () => hasCustomers.value],
    ([step, hasCustomers]) => {
      if (step.title === steps.value["customer-details"].title && !hasCustomers)
        $fetch<{ data: TCustomerSchema[] }>("/api/customers").then((r) => {
          customerResults.value = r;
        });
    },
  );

  const shouldDisableSubmitButton = computed(() => {
    if (isSubmitting.value) return true;

    switch (true) {
      case currentStep.value === steps.value["items-list"] &&
        !errors.value.items &&
        currentStep.value.isValid():
        return false;

      case currentStep.value === steps.value["customer-details"] &&
        !errors.value.cx &&
        currentStep.value.isValid():
        return false;

      case currentStep.value === steps.value["delivery-instructions"] &&
        !errors.value.delivery &&
        currentStep.value.isValid():
        return false;

      case currentStep.value === steps.value["preview-order"] &&
        currentStep.value.isValid():
        return false;

      default:
        return true;
    }
  });

  const dialogActions = {
    isOpen: ref(false),
    openDialog: () => {
      dialogActions.isOpen.value = true;
    },
    closeDialog: () => {
      dialogActions.isOpen.value = false;
    },
  };

  const alertActions = {
    isAlertOpen: ref(false),
    isItems: ref(false),
    isRestart: ref(false),
    showText: computed(() => {
      if (alertActions.isItems.value)
        return useI18n().t("components.alerts.order.delete-items.description");
      if (alertActions.isRestart.value)
        return useI18n().t("components.alerts.order.restart");
    }),
    openAlert: () => {
      alertActions.isAlertOpen.value = true;
    },
    closeAlert: () => {
      alertActions.isAlertOpen.value = false;
    },
    showItems: () => {
      alertActions.isItems.value = true;
    },
    attemptRestart: () => {
      alertActions.isRestart.value = true;
    },
    confirmRemoval: () => {
      if (alertActions.isItems.value)
        return setValues({ ...values, items: [] });
    },
    restartFromBeginning: () => {
      resetForm();
      goTo("items-list");
    },
  };

  const cxActions = {
    setNewCustomer: () => {
      setValues({
        ...values,
        cx: {
          id: "NEW_CUSTOMER",
          fullName: "",
          email: "",
          phone: {
            countryCode: "1",
            number: "",
          },
          isSameAsWhatsapp: true,
        },
      });
    },
    setExistingCustomer: (customer: TCustomerSchema) => {
      setValues({
        ...values,
        cx: {
          id: customer.id,
          fullName: customer.fullName,
          email: customer.email || "",
          phone: {
            countryCode: customer.phone.countryCode,
            number: customer.phone.number,
          },
          whatsappNumber: !customer.whatsappNumber
            ? undefined
            : {
                countryCode: customer.whatsappNumber.countryCode,
                number: customer.whatsappNumber.number,
              },
          isSameAsWhatsapp: false,
        },
      });
    },
    setNoCustomer: () => {
      setValues({
        ...values,
        cx: undefined,
      });
    },
    setWhatsappSameAsContact: (isSame: boolean) => {
      if (isSame)
        setValues({
          ...values,
          cx: {
            ...values.cx,
            isSameAsWhatsapp: true,
            whatsappNumber: undefined,
          },
        });
      else
        setValues({
          ...values,
          cx: {
            ...values.cx,
            isSameAsWhatsapp: false,
            whatsappNumber: {
              countryCode: "",
              number: "",
            },
          },
        });
    },
  };

  const deliveryActions = {
    setDeliveryRequired: (isRequired: boolean) => {
      if (!isRequired)
        setValues({
          ...values,
          delivery: {
            ...values.delivery,
            isRequired: false,
            address: undefined,
          },
        });
      else
        setValues({
          ...values,
          delivery: {
            ...values.delivery,
            isRequired: true,
            address: {
              street: "",
              city: "",
              postalCode: "",
              province: "Quebec",
              country: "Canada",
            },
          },
        });
    },
    setHomeAddress: (isHome: boolean) => {
      if (isHome)
        setValues({
          ...values,
          delivery: {
            ...values.delivery,
            address: {
              ...values.delivery?.address,
              isHomeAddress: true,
            },
          },
        });
      else
        setValues({
          ...values,
          delivery: {
            ...values.delivery,
            address: {
              ...values.delivery?.address,
              isHomeAddress: false,
            },
          },
        });
    },
  };
</script>
<template>
  <UIDialog v-model:open="dialogActions.isOpen.value">
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
              "No items menu found.",
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
          >{{ $t("components.order.create-panel.menu.no-menu-link") }}</NuxtLink
        >
      </section>

      <section v-show="hasMenu" class="p-6 flex flex-col gap-y-8">
        <header>
          <div class="h-fit flex justify-between cursor-pointer">
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

              <small v-if="k !== 3" class="w-fit">
                <ChevronRight :size="16" />
              </small>
            </span>
          </div>
        </header>
        <footer class="flex-1">
          <UIAlertDialog v-model:open="alertActions.isAlertOpen.value">
            <AppOrderCreatePanelItemsList
              :data="values.items ?? []"
              :total-aggregate="formItemsTotal"
              @remove-all="
                () => {
                  alertActions.openAlert();
                  alertActions.showItems();
                }
              "
              v-if="currentStep === steps['items-list']"
            />

            <AppOrderCreatePanelCustomerDetails
              :has-customers="hasCustomers"
              :data="values.cx as Partial<TCreateOrderFormSchema['cx']>"
              @set-customer="
                (type, v) =>
                  type === 'new'
                    ? cxActions.setNewCustomer()
                    : type === 'existing'
                      ? cxActions.setExistingCustomer({
                          ...v!,
                          id: v!.id || '',
                        })
                      : cxActions.setNoCustomer()
              "
              @set-whatsapp="
                (w) =>
                  cxActions.setWhatsappSameAsContact(
                    typeof w === 'boolean' ? w : true,
                  )
              "
              v-else-if="currentStep === steps['customer-details']"
            />

            <AppOrderCreatePanelDeliveryInstructions
              :data="
                values.delivery as Partial<TCreateOrderFormSchema['delivery']>
              "
              @update:delivery="deliveryActions.setDeliveryRequired($event)"
              @update:home-address="deliveryActions.setHomeAddress($event)"
              v-else-if="currentStep === steps['delivery-instructions']"
            />

            <AppOrderCreatePanelPreview
              :ordered-items="values.items || []"
              :delivery-info="{
                isRequested: values.delivery?.isRequired || false,
                fee:
                  typeof values.delivery?.minimumFee === 'number'
                    ? values.delivery?.minimumFee
                    : typeof values.delivery?.minimumFee === 'string'
                      ? parseFloat(values.delivery?.minimumFee)
                      : 10,
                address: values.delivery?.address,
              }"
              :cx-info="{
                fullName: values.cx?.fullName || '',
                phoneNumber: `+${values.cx?.phone?.countryCode ?? '1'} ${values.cx?.phone?.number || ''}`,
                whatsappNumber: values.cx?.isSameAsWhatsapp
                  ? `+${values.cx?.phone?.countryCode ?? '1'} ${values.cx?.phone?.number || ''}`
                  : `+${values.cx?.whatsappNumber?.countryCode ?? ''} ${values.cx?.whatsappNumber?.number || ''}`,
                email: values.cx?.email || '',
              }"
              @modify-items="goTo('items-list')"
              @modify-customer="goTo('customer-details')"
              @modify-address="goTo('delivery-instructions')"
              @update:delivery="deliveryActions.setDeliveryRequired($event)"
              v-else
            />

            <UIAlertDialogContent>
              <UIAlertDialogHeader>
                <UIAlertDialogTitle class="text-primary-1300">{{
                  $t("components.alerts.generic.title")
                }}</UIAlertDialogTitle>
                <UIAlertDialogDescription>
                  {{ alertActions.showText.value }}
                </UIAlertDialogDescription>
              </UIAlertDialogHeader>
              <UIAlertDialogFooter>
                <UIAlertDialogCancel>{{
                  $t("components.alerts.generic.cancel-button")
                }}</UIAlertDialogCancel>
                <UIButton
                  @click="
                    () => {
                      if (!alertActions.isRestart.value)
                        alertActions.confirmRemoval();
                      else alertActions.restartFromBeginning();
                      return alertActions.closeAlert();
                    }
                  "
                  >{{
                    $t("components.alerts.generic.confirm-button")
                  }}</UIButton
                >
              </UIAlertDialogFooter>
            </UIAlertDialogContent>
          </UIAlertDialog>
        </footer>
      </section>

      <UIDialogFooter v-show="hasMenu" class="justify-between">
        <UIButton
          v-show="currentStepIndex > 0"
          :variant="'link'"
          :class="'text-neutral-grey-1000 hover:bg-neutral-grey-300 hover:no-underline'"
          @click="goToPrevious()"
        >
          <ChevronLeft :size="20" /> Go back
        </UIButton>
        <div class="space-x-2 flex-1 text-right">
          <UIButton
            :variant="'outline'"
            :disabled="values.items ? values.items.length === 0 : true"
            @click="
              () => {
                alertActions.openAlert();
                alertActions.attemptRestart();
              }
            "
          >
            {{ $t("components.order.create-panel.restart-button") }}
          </UIButton>
          <UIButton
            :disabled="shouldDisableSubmitButton"
            :variant="'primary'"
            @click="
              () => {
                if (
                  currentStep !== steps['preview-order'] &&
                  currentStep.isValid()
                )
                  goToNext();
                else submitForm();
              }
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
</template>
