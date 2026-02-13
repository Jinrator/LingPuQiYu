# 采样文件目录

此目录存放乐器采样文件。

## 目录结构

```
samples/
├── drums/
│   ├── acoustic/     原声鼓组 (Tone.js breakbeat13)
│   │   ├── kick.mp3
│   │   ├── snare.mp3
│   │   ├── hihat.mp3
│   │   ├── openhat.mp3
│   │   ├── rimshot.mp3
│   │   ├── clap.mp3
│   │   ├── lowtom.mp3
│   │   ├── midtom.mp3
│   │   ├── hightom.mp3
│   │   ├── crash.mp3
│   │   └── ride.mp3
│   └── electronic/   电子鼓组 (oramics TR-808)
│       └── (同上，.wav 格式)
└── piano/            钢琴采样 (Salamander Grand Piano, CC-BY 3.0)
    ├── C3.mp3
    ├── Ds3.mp3
    ├── Fs3.mp3
    ├── A3.mp3
    ├── C4.mp3
    ├── Ds4.mp3
    ├── Fs4.mp3
    ├── A4.mp3
    ├── C5.mp3
    ├── Ds5.mp3
    ├── Fs5.mp3
    └── A5.mp3
```

## 采样要求

- 格式：MP3 (推荐) 或 WAV
- 采样率：44100Hz
- 鼓组：每个文件为单次敲击 (one-shot)，时长 0.5-3 秒
- 钢琴：每个文件为单音符，时长 2-4 秒，Tone.js Sampler 会自动插值其余音高

## 采样来源

- 鼓组：[oramics/sampled](https://oramics.github.io/sampled/) (CC 许可)
- 钢琴：[Salamander Grand Piano](https://tonejs.github.io/audio/salamander/) (CC-BY 3.0)
