import { en } from "./en";

export const pt = {
  ...en,
  nav: {
    ...en.nav,
    home: "Início",
    fleet: "Frota",
    locations: "Locais",
    about: "Sobre nós",
    contact: "Contato",
    accountLogin: "Entrar",
    myAccount: "Minha conta",
  },
  common: {
    ...en.common,
    bookNow: "Reservar agora",
    continue: "Continuar",
    back: "Voltar",
    total: "Total",
  },
  bookingUnavailable: {
    eyebrow: "Quick Key Rental · Curaçao",
    title: "A reserva online está temporariamente indisponível",
    body: "Estamos a atualizar o nosso sistema de reservas para garantir que tudo funcione de forma simples e segura.",
    urgent: "Para reservas urgentes, contacte-nos pelo WhatsApp.",
    cta: "Contactar pelo WhatsApp",
    pauseLabel: "Pausa temporária",
    directHelp: "Ajudamos a reservar diretamente.",
    whatsappMessage: "Olá Quick Key, gostaria de fazer uma reserva.",
  },
  book: {
    ...en.book,
    cancellation:
      "As condições de cancelamento podem depender do tempo restante antes da retirada. Consulte as condições de cancelamento aplicáveis antes de confirmar a sua reserva.",
    customer: {
      ...en.book.customer,
      arrivingByPlane: "Vai chegar a Curaçao de avião?",
      arrivalHint: "Isto ajuda-nos a acompanhar a chegada, mesmo com entrega no hotel.",
      yes: "Sim",
      no: "Não",
      flightNumber: "Número do voo",
    },
    errors: {
      ...en.book.errors,
      arrivingByPlane: "Indique se vai chegar de avião.",
      flightNumber: "Informe o número do voo se chegar de avião.",
      pickupInPast: "Escolha uma hora de entrega que ainda esteja no futuro em Curaçao.",
      holdRateLimited:
        "Já existem reservas ativas nesta ligação. Conclua uma ou tente novamente mais tarde.",
      paymentInProgress:
        "O pagamento já está a ser preparado. Aguarde um momento e tente novamente.",
      bookingDisabled:
        "As reservas online estão temporariamente indisponíveis. Contacte a Quick Key via WhatsApp.",
      sentooNoUrl:
        "Não conseguimos iniciar o pagamento seguro. Tente novamente ou contacte a Quick Key.",
    },
    insurance: {
      ...en.book.insurance,
      depositBody:
        "Na entrega, verificamos se o cartão é válido e pode cobrir o depósito se necessário.",
      depositAmount: "{amount} de depósito",
      depositAtDelivery: "Não cobrado online",
      depositBenefitNotOnline: "Não cobrado online",
    },
    review: {
      ...en.book.review,
      depositDueAtDelivery: "Não cobrado online. A validade do cartão é verificada na entrega.",
    },
    payment: {
      ...en.book.payment,
      syncing: "A verificar o estado do pagamento…",
      recoveryActive:
        "Já existe uma sessão de pagamento aberta. Pode retomá-la ou voltar à reserva.",
      recoveryFailed: "Esse pagamento não foi concluído. Pode tentar novamente com segurança.",
      resumePayment: "Retomar pagamento",
      returnToBooking: "Voltar à reserva",
      cancelCheckout: "Cancelar checkout",
      retry: "Tentar novamente",
    },
    confirmation: {
      ...en.book.confirmation,
      greeting: "Obrigado, {name}. Os detalhes da sua reserva estão prontos.",
      vehicle: "Carro",
      rentalPeriod: "Período de aluguer",
      delivery: "Entrega",
      collection: "Recolha",
      paidTotal: "Total pago",
      paymentPendingTotal: "Total",
      manageAccount: {
        ...en.book.confirmation.manageAccount,
        title: "Gerir a sua reserva",
        subtitle:
          "Aceda à sua conta QuickKey em segurança. Sem palavra-passe nem formulário de registo.",
        emailNotice: "O link de acesso seguro será enviado para",
        submit: "Ver e gerir a minha reserva",
        sentTitle: "Verifique o seu e-mail",
        sentBody:
          "Enviámos um link seguro para {email}. Abra-o para aceder à sua conta e gerir esta reserva.",
        signedIn: "Tem sessão iniciada. Consulte e gira a sua reserva quando quiser.",
        viewAccount: "Ver a minha reserva",
        help: "Precisa de ajuda com a sua reserva?",
      },
    },
    cars: {
      ...en.book.cars,
      details: "Ver detalhes",
    },
    hold: {
      reserving: "Reservando o seu carro…",
      active: "O seu carro está temporariamente reservado",
      remaining: "Restam {time}",
      reservedUntil: "Reservado até {time} enquanto conclui a reserva.",
      urgent: "Restam menos de {time} para concluir a reserva.",
      expired:
        "A reserva temporária do seu carro expirou. Escolha novamente um carro disponível para continuar.",
      missing: "Reserve novamente o seu carro antes de continuar para o pagamento.",
    },
  },
  account: {
    ...en.account,
    dashboard: {
      ...en.account.dashboard,
      nextStepsTitle: "Antes da viagem",
      tripReadyHint: "Os detalhes da sua viagem em Curaçao estão aqui.",
      statusItems: {
        booking: "Dados da reserva",
        documents: "Documentos",
        support: "Suporte WhatsApp",
      },
      nextSteps: {
        confirmedTitle: "Verifique a reserva",
        confirmedBody: "Confira retirada, devolução e dados do carro antes de chegar.",
        documentsTitle: "Prepare documentos",
        documentsBody: "Tenha sua carta de condução pronta ou envie documentos quando solicitado.",
        supportTitle: "Precisa alterar algo?",
        supportBody: "Envie uma mensagem à Quick Key no WhatsApp para ajuda pessoal.",
      },
    },
    bookings: {
      ...en.account.bookings,
      emptyUpcoming: "Não há reservas futuras.",
      emptyCompleted: "Ainda não há reservas concluídas.",
      emptyCancelled: "Não há reservas canceladas.",
      modifyWindowClosed:
        "Alterações online podem depender do tempo restante antes da retirada. Contacte o suporte para analisar as opções desta reserva.",
      cancellationDialog: {
        ...en.account.bookings.cancellationDialog,
        freeBody:
          "De acordo com as condições de cancelamento aplicáveis a esta reserva, nenhuma taxa de cancelamento é apresentada agora.",
        feeBody:
          "De acordo com as condições de cancelamento aplicáveis a esta reserva, é apresentada uma taxa de cancelamento de {fee}.",
      },
    },
    documents: {
      ...en.account.documents,
      title: "Documentos",
      subtitle:
        "Envie sua carta de condução ou documento de identidade para um check-in mais rápido.",
      privacyTitle: "Verificação privada de documentos",
      privacyBody:
        "Usamos estes documentos apenas para preparar a entrega e verificar o condutor principal ou adicional. A equipe autorizada pode analisá-los com acesso privado; os arquivos enviados permanecem privados durante o ciclo do documento.",
      guidance: [
        "Envie um passaporte, documento de identidade ou carta de condução válido.",
        "Certifique-se de que o documento completo está visível.",
        "Certifique-se de que o texto e a foto estão legíveis.",
        "Envie o documento que corresponde ao tipo selecionado.",
        "Estes documentos ajudam a Quick Key a preparar a entrega e o contrato de aluguer.",
      ],
      pickupAlternative:
        "Prefere não enviar online? Pode apresentar os documentos originais válidos na retirada do veículo.",
      type: "Tipo de documento",
      upload: "Enviar documento",
      deletedSecurely: "Este documento foi eliminado com segurança pela Quick Key.",
    },
    manageBooking: {
      ...en.account.manageBooking,
      addExtras: "Adicionar extras",
      currentTotal: "Total atual",
      priceDelta: "Custo adicional",
      newTotal: "Novo total",
      sameAsPickup: "Deixe vazio se for igual à retirada",
      timeLabel: "Hora de retirada e devolução",
      notModifiable:
        "Alterações online estão disponíveis apenas quando faltam mais de 7 dias para a retirada. Alterações ainda podem ser possíveis conforme disponibilidade e aprovação.",
    },
  },
} satisfies typeof en;
