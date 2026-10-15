(() => {
    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    );

    const finePointer = window.matchMedia(
        "(hover: hover) and (pointer: fine)"
    );

    if (reducedMotion.matches || !finePointer.matches) return;

    const image = new Image();
    image.src = "images/gotrolly-sketch-background.png";

    image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.id = "sketch-crumble";
        canvas.setAttribute("aria-hidden", "true");

        Object.assign(canvas.style, {
            position: "fixed",
            inset: "0",
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: "0"
        });

        const networkCanvas = document.getElementById("idea-network");

        if (networkCanvas) {
            document.body.insertBefore(canvas, networkCanvas);
        } else {
            document.body.prepend(canvas);
        }

        const context = canvas.getContext("2d");

        if (!context) {
            canvas.remove();
            return;
        }

        document.body.classList.add("sketch-crumble-ready");

        let width = 0;
        let height = 0;
        let sketch = {};
        let lastPoint = null;
        const patches = [];
        const patchLifetime = 3000;
        const patchRadius = 28;

        function resize() {
            const ratio = Math.min(
                window.devicePixelRatio || 1,
                2
            );

            width = window.innerWidth;
            height = window.innerHeight;

            canvas.width = width * ratio;
            canvas.height = height * ratio;
            context.setTransform(ratio, 0, 0, ratio, 0, 0);

            sketch.width = Math.min(width * 0.48, 580);
            sketch.height =
                sketch.width * image.naturalHeight / image.naturalWidth;
            sketch.left = width * 0.05;
            sketch.top = 128;
        }

        function makePatch(x, y, now) {
            const fragments = [];

            for (let i = 0; i < 9; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * patchRadius * 0.8;
                const size = 5 + Math.random() * 8;

                const fx = x + Math.cos(angle) * distance;
                const fy = y + Math.sin(angle) * distance;

                const sx = Math.max(
                    0,
                    Math.min(
                        image.naturalWidth - 1,
                        (fx - sketch.left) *
                            image.naturalWidth / sketch.width
                    )
                );

                const sy = Math.max(
                    0,
                    Math.min(
                        image.naturalHeight - 1,
                        (fy - sketch.top) *
                            image.naturalHeight / sketch.height
                    )
                );

                const sourceSize =
                    size * image.naturalWidth / sketch.width;

                fragments.push({
                    x: fx,
                    y: fy,
                    sx,
                    sy,
                    sw: sourceSize,
                    sh: sourceSize,
                    vx: (Math.random() - 0.5) * 100,
                    vy: 25 + Math.random() * 65,
                    spin: (Math.random() - 0.5) * 1.2,
                    angle: 0,
                    size
                });
            }

            patches.push({ x, y, started: now, fragments });
        }

        function draw(now) {
            context.clearRect(0, 0, width, height);

            context.drawImage(
                image,
                sketch.left,
                sketch.top,
                sketch.width,
                sketch.height
            );

            for (let i = patches.length - 1; i >= 0; i--) {
                const patch = patches[i];
                const age = now - patch.started;

                if (age >= patchLifetime) {
                    patches.splice(i, 1);
                    continue;
                }

                context.save();
                context.beginPath();
                context.arc(
                    patch.x,
                    patch.y,
                    patchRadius,
                    0,
                    Math.PI * 2
                );
                context.clip();
                context.clearRect(
                    patch.x - patchRadius,
                    patch.y - patchRadius,
                    patchRadius * 2,
                    patchRadius * 2
                );
                context.restore();

                const seconds = age / 1000;
                const fade = 1 - age / patchLifetime;

                patch.fragments.forEach((fragment) => {
                    const fall = fragment.vy * seconds +
                        95 * seconds * seconds;

                    context.save();
                    context.globalAlpha = Math.max(0, fade);
                    context.translate(
                        fragment.x + fragment.vx * seconds,
                        fragment.y + fall
                    );
                    context.rotate(fragment.spin * seconds);

                    context.drawImage(
                        image,
                        fragment.sx,
                        fragment.sy,
                        fragment.sw,
                        fragment.sh,
                        -fragment.size / 2,
                        -fragment.size / 2,
                        fragment.size,
                        fragment.size
                    );

                    context.restore();
                });
            }

            window.requestAnimationFrame(draw);
        }

        window.addEventListener("pointermove", (event) => {
            const x = event.clientX;
            const y = event.clientY;

            const insideSketch =
                x >= sketch.left &&
                x <= sketch.left + sketch.width &&
                y >= sketch.top &&
                y <= sketch.top + sketch.height;

            if (!insideSketch) {
                lastPoint = null;
                return;
            }

            if (
                !lastPoint ||
                Math.hypot(x - lastPoint.x, y - lastPoint.y) >= 22
            ) {
                makePatch(x, y, performance.now());
                lastPoint = { x, y };
            }
        }, { passive: true });

        window.addEventListener("resize", resize);

        resize();
        window.requestAnimationFrame(draw);
    };
})();