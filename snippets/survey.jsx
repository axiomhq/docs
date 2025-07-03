export const Survey = () => {
    const ref = window.location.href;
    useEffect(() => {
        const scriptId = 'tally-embed';
        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = 'https://tally.so/widgets/embed.js';
            script.async = true;
            document.body.appendChild(script);
        }

        window.TallyConfig = {
            formId: 'wQqlyl',
            popup: {
                open: {
                    trigger: 'time',
                    ms: 1, // 10 seconds
                },
                "hideTitle": true,
                "autoClose": 3000,
                "showOnce": true,
                "doNotShowAfterSubmit": true,
            },
        };
    }, []);

    return null;
};
