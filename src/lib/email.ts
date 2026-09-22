interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<void> {
    console.log('Email service called:', {
        to,
        subject,
        html,
    });

    // Email provider integration will be added here.
}