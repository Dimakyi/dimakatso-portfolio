(() => {
    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    );

    const finePointer = window.matchMedia(
        "(hover: hover) and (pointer: fine)"
    );

    if (reducedMotion.matches || !finePointer.matches) return;

    const canvas = document.createElement("canvas");
    canvas.id = "idea-network";
    canvas.setAttribute("aria-hidden", "true");

    Object.assign(canvas.style, {
        position: "fixed",
        inset: "0",
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: "0",
        opacity: "0.9"
    });

    document.body.prepend(canvas);

    const context = canvas.getContext("2d");

    if (!context) {
        canvas.remove();
        return;
    }

    let width = 0;
    let height = 0;
    let nodes = [];
    let mouse = { x: -1000, y: -1000 };

    function resize() {
        const ratio = Math.min(window.devicePixelRatio || 1, 2);

        width = window.innerWidth;
        height = window.innerHeight;

        canvas.width = width * ratio;
        canvas.height = height * ratio;

        context.setTransform(ratio, 0, 0, ratio, 0, 0);

        const count = Math.min(
            100,
            Math.max(35, Math.floor((width * height) / 14000))
        );

        nodes = Array.from({ length: count }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: 1.5 + Math.random() * 1.5
        }));
    }

    function drawNetwork() {
        nodes.forEach((node, index) => {
            const distanceToMouse = Math.hypot(
                node.x - mouse.x,
                node.y - mouse.y
            );

            const glow = Math.max(
                0,
                1 - distanceToMouse / 190
            );

            for (
                let next = index + 1;
                next < nodes.length;
                next++
            ) {
                const other = nodes[next];

                const distance = Math.hypot(
                    node.x - other.x,
                    node.y - other.y
                );

                if (distance < 145) {
                    const brightness =
                        0.22 * (1 - distance / 145) + glow * 0.4;

                    context.beginPath();
                    context.moveTo(node.x, node.y);
                    context.lineTo(other.x, other.y);

                    context.strokeStyle =
                        `rgba(255, 134, 26, ${brightness})`;

                    context.lineWidth = 1.2;
                    context.stroke();
                }
            }

            context.beginPath();

            context.arc(
                node.x,
                node.y,
                node.radius + glow * 3,
                0,
                Math.PI * 2
            );

            context.fillStyle =
                `rgba(255, 170, 75, ${0.7 + glow * 0.3})`;

            context.shadowColor = "#FF861A";
            context.shadowBlur = 5 + glow * 20;
            context.fill();
            context.shadowBlur = 0;
        });
    }

    function drawCursorGlow() {
        if (
            mouse.x < 0 ||
            mouse.y < 0 ||
            mouse.x > width ||
            mouse.y > height
        ) {
            return;
        }

        context.beginPath();
        context.arc(mouse.x, mouse.y, 3, 0, Math.PI * 2);
        context.fillStyle = "#FF861A";
        context.fill();
    }
    function animate() {
        context.clearRect(0, 0, width, height);

        drawNetwork();
        drawCursorGlow();

        window.requestAnimationFrame(animate);
    }

    window.addEventListener("resize", resize);

    window.addEventListener(
        "pointermove",
        (event) => {
            mouse.x = event.clientX;
            mouse.y = event.clientY;
        },
        { passive: true }
    );

    window.addEventListener("pointerleave", () => {
        mouse = { x: -1000, y: -1000 };
    });

    resize();
    animate();
})();