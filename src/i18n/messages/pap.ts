import { en } from "./en";

export const pap = {
  ...en,
  nav: {
    ...en.nav,
    home: "Inicio",
    fleet: "Flota",
    locations: "Lugarnan",
    about: "Tokante nos",
    contact: "Kontakto",
    accountLogin: "Login",
    myAccount: "Mi cuenta",
  },
  common: {
    ...en.common,
    bookNow: "Reserva awor",
    continue: "Sigui",
    back: "Bai bek",
    total: "Total",
  },
  bookingUnavailable: {
    eyebrow: "Quick Key Rental · Kòrsou",
    title: "Reserva online no ta disponibel temporalmente",
    body: "Nos ta aktualisá nos sistema di reserva pa sigurá ku tur kos ta funshoná bon i sigur.",
    urgent: "Pa reserva urgente, tuma kontakto ku nos via WhatsApp.",
    cta: "Tuma kontakto via WhatsApp",
    pauseLabel: "Pousa temporal",
    directHelp: "Nos ta yuda bo reserva direktamente.",
    whatsappMessage: "Bon dia Quick Key, mi ke hasi un reserva.",
  },
  book: {
    ...en.book,
    cancellation:
      "Kondishonnan di kanselashon por dependé di e tempu ku falta promé ku entrega. Kontrolá e kondishonnan di kanselashon aplikabel promé ku bo konfirmá bo reserva.",
    customer: {
      ...en.book.customer,
      arrivingByPlane: "Bo ta yega Kòrsou ku avion?",
      arrivalHint: "Esaki ta yuda nos sigui bo ora di yegada, asta ora nos ta entrega na hotel.",
      yes: "Si",
      no: "No",
      flightNumber: "Number di vuelo",
    },
    errors: {
      ...en.book.errors,
      arrivingByPlane: "Skohe si bo ta yega ku avion.",
      flightNumber: "Yena bo number di vuelo si bo ta yega ku avion.",
      pickupInPast: "Skohe un ora di entrega ku ainda ta den futuro na Kòrsou.",
      holdRateLimited:
        "Tin reservashonnan aktivo kaba for di e konekshon aki. Kompletá un of purba mas lat.",
      paymentInProgress: "E pago ta wordu prepará kaba. Warda un momentu i purba atrobe.",
      sentooNoUrl: "Nos no por a start e pago sigur. Purba atrobe of tuma kontakto ku Quick Key.",
    },
    insurance: {
      ...en.book.insurance,
      depositBody:
        "Na pickup nos ta kontrolá ku bo karta ta válido i por kubri e deposito si ta necesario.",
      depositAmount: "{amount} deposito di seguridat",
      depositAtDelivery: "No ta wordu kobrá online",
      depositBenefitNotOnline: "No ta wordu kobrá online",
    },
    review: {
      ...en.book.review,
      depositDueAtDelivery: "No ta wordu kobrá online. Nos ta kontrolá validés di karta na pickup.",
    },
    payment: {
      ...en.book.payment,
      syncing: "Kontrolando status di pago…",
      recoveryActive:
        "Un seshon di pago ta habrí kaba. Bo por sigui ku pago of bolbe na bo reserva.",
      recoveryFailed: "E pago aki no a kompletá. Bo por purba atrobe sigur.",
      resumePayment: "Sigui ku pago",
      returnToBooking: "Bolbe na reserva",
      cancelCheckout: "Kanselá checkout",
      retry: "Purba atrobe",
    },
    confirmation: {
      ...en.book.confirmation,
      greeting: "Masha danki, {name}. Detayenan di bo reserva ta kla.",
      vehicle: "Outo",
      rentalPeriod: "Periodo di huur",
      delivery: "Entrega",
      collection: "Kolekshon",
      paidTotal: "Total pagá",
      paymentPendingTotal: "Total",
      manageAccount: {
        ...en.book.confirmation.manageAccount,
        title: "Manehá bo reserva",
        subtitle:
          "Habri bo cuenta QuickKey sigur. No tin mester di password ni formulario di registro.",
        emailNotice: "E link sigur di akseso lo wordu manda na",
        submit: "Mira i manehá mi reserva",
        sentTitle: "Kontrolá bo e-mail",
        sentBody:
          "Nos a manda un link sigur na {email}. Habri'é pa drenta bo cuenta i manehá e reserva aki.",
        signedIn: "Bo ta log in. Mira i manehá bo reserva tur ora.",
        viewAccount: "Mira mi reserva",
        help: "Mester yudansa ku bo reserva?",
      },
    },
    cars: {
      ...en.book.cars,
      details: "Mira detayenan",
    },
    hold: {
      reserving: "Reservando bo outo…",
      active: "Bo outo ta reservá temporalmente",
      remaining: "{time} ta resta",
      reservedUntil: "Reservá te {time} mientras bo ta kompletá bo reserva.",
      urgent: "Menos ku {time} resta pa kompletá bo reserva.",
      expired: "E reserva temporal di bo outo a kaduká. Skohe un outo disponibel atrobe pa sigui.",
      missing: "Reserva bo outo atrobe promé ku bo sigui pa pago.",
    },
  },
  account: {
    ...en.account,
    dashboard: {
      ...en.account.dashboard,
      nextStepsTitle: "Promé ku bo biahe",
      tripReadyHint: "Bo detayenan di biahe na Kòrsou ta kla aki.",
      statusItems: {
        booking: "Detayenan di reserva",
        documents: "Dokumentonan",
        support: "WhatsApp support",
      },
      nextSteps: {
        confirmedTitle: "Kontrolá bo reserva",
        confirmedBody: "Kontrolá entrega, devolushon i detayenan di e outo promé ku bo yega.",
        documentsTitle: "Prepará dokumentonan",
        documentsBody: "Tene bo lisensia kla of upload dokumentonan ora nos pidi.",
        supportTitle: "Mester kambia algu?",
        supportBody: "Manda Quick Key un WhatsApp pa yudansa personal.",
      },
    },
    bookings: {
      ...en.account.bookings,
      emptyUpcoming: "No tin reserva venidero.",
      emptyCompleted: "No tin reserva kompletá ainda.",
      emptyCancelled: "No tin reserva kanselá.",
      modifyWindowClosed:
        "Kambionan online por dependé di e tempu ku falta promé ku entrega. Tuma kontakto ku support pa wak e opshonnan pa e reserva aki.",
      cancellationDialog: {
        ...en.account.bookings.cancellationDialog,
        freeBody:
          "Segun e kondishonnan di kanselashon aplikabel pa e reserva aki, no ta mustra ningun kosto di kanselashon awor.",
        feeBody:
          "Segun e kondishonnan di kanselashon aplikabel pa e reserva aki, ta mustra un kosto di kanselashon di {fee}.",
      },
    },
    documents: {
      ...en.account.documents,
      title: "Dokumentonan",
      subtitle: "Upload bo lisensia di korementu of ID pa un check-in mas lihé.",
      privacyTitle: "Kontrol privá di dokumento",
      privacyBody:
        "Nos ta uza e dokumentonan aki solamente pa prepará entrega di e outo i kontrolá e driver prinsipal of ekstra. Personal outorisá por mira nan ku akseso privá; failnan upload ta keda privá durante siklo di dokumento.",
      guidance: [
        "Upload un pasport, ID-kaart of lisensia di korementu válido.",
        "Sòru ku henter e dokumento ta visibel.",
        "Sòru ku e teksto i potrèt ta lesabel.",
        "Upload e dokumento ku ta kuadra ku e tipo ku bo a skohe.",
        "E dokumentonan aki ta yuda Quick Key prepará entrega i kontrakt di huur.",
      ],
      pickupAlternative:
        "Bo no ta preferá upload online? Bo por mustra bo dokumentonan original válido na entrega di e outo.",
      type: "Tipo di dokumento",
      upload: "Upload dokumento",
      deletedSecurely: "Quick Key a eliminá e dokumento aki na forma sigur.",
    },
    manageBooking: {
      ...en.account.manageBooking,
      addExtras: "Añadí extras",
      currentTotal: "Total aktual",
      priceDelta: "Kosto ekstra",
      newTotal: "Total nobo",
      sameAsPickup: "Laga bashí si ta meskos ku entrega",
      timeLabel: "Ora di entrega i devolushon",
      notModifiable:
        "Kambionan online ta disponibel solamente ora pickup ta mas ku 7 dia leu. Kambio por ta posibel ainda, dependé di disponibilidat i aprobashon.",
    },
  },
} satisfies typeof en;
