# Antfarm Prototype

This is a simulated ant farm using React + PixiJS. You can find it at https://meomix.github.io/antfarm/

The logic was mostly ported from a program called xantfarm. xantfarm written in 1991, for Unix, by Jef Poskanzer. You can see it on YouTube here: https://www.youtube.com/watch?v=K-3-1JROzzA

Ultimately, this project's scope settled on being a prototype to explore the performance limitations of creating a web-based simulation game using React. The main performance bottleneck is the React reconciler which was never designed to efficiently render onto an HTMLCanvasElement, but there is also an issue with garbage collection which results in the program lurching every once in a while as GC runs. It would require rewriting this code imperatively, and likely ditching React, to address these issues.
