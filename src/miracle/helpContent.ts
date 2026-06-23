export function getUserGuideHtml(): string {
    return `
        <div class="miracle-user-card">
            <p style="margin-top:0;"><b>これは何？</b></p>
            <p style="line-height:1.85;">MiracleBallLabは、たくさんの玉を落として、まれに起きる「奇跡」を集めていく実験あそびです。</p>
            <p style="line-height:1.85;">玉がどこに入るか、どんな演出が出るか、どの奇跡を発見できるかをゆっくり眺めながら楽しめます。</p>
        </div>
        <div class="miracle-user-card">
            <p style="margin-top:0;"><b>楽しみ方</b></p>
            <ul style="line-height:1.85;margin-bottom:0;">
                <li>まずは「実験を開始」を押して、玉の動きを観察します。</li>
                <li>特別な玉や演出が出ると、奇跡図鑑やアルバムに記録されます。</li>
                <li>実験が終わると、今回の結果が研究レポートとして残ります。</li>
                <li>毎日のミッションや研究員ランクを進めると、少しずつ遊びの幅が広がります。</li>
            </ul>
        </div>
        <div class="miracle-user-card">
            <p style="margin-top:0;"><b>スマホで重いとき</b></p>
            <p style="line-height:1.85;">動きが重い、端末が熱くなる、演出が止まりやすい場合は、設定から「低スペック: ON」にしてください。動画や派手な演出を控えめにして遊びやすくします。</p>
        </div>
    `;
}
