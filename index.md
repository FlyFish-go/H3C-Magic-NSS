# H3C Magic NSS package repositories

One directory per release of [FlyFish-go/H3C-Magic-NSS](https://github.com/FlyFish-go/H3C-Magic-NSS):
the package repository of that build (kernel modules, toolchain libraries such as `libstdcpp6`,
and the packages of this tree), signed with the key in that release's images. Kernel modules only
install on an image from the same build. Each image lists its own directory in
`/etc/apk/repositories.d/distfeeds.list`.

每个版本一个目录，是该版本构建出来的软件仓库（内核模块、`libstdcpp6` 等工具链库、本项目的软件包），
用该版本镜像里的密钥签名。内核模块只能装在同一次构建的固件上；固件默认已配置好自己的目录。

- [v0.1.0-pre.4](v0.1.0-pre.4/packages.adb) — [release](https://github.com/FlyFish-go/H3C-Magic-NSS/releases/tag/v0.1.0-pre.4)
