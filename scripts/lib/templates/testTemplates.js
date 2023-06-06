export let tmpHtml_pretty = `
    <div style="{{style}}" className="{{className}}" onclick="{{onClick}}">
        hello, {{textContent}} {{ }}
        <div style="background-color: orange" className="container">
            Orange-backgrounded container
        </div>
        <div style="background-color: blue" className="container">
            Blue-backgrounded container
        </div>
    </div>
`

export let tmpHtml= `     <div> Hello, World!


\n\n<div style="background-color: cyan"> Child1  \n </div>   <div   
style="background-color: yellow" >\n\n\{{textContent}}\n 
</div>\n</div> `;

export let tmpHtml_s2= `<div className="container" style="background-color: blue" min-height="150px"><div className="container" style="background-color: cyan; border-radius: 0% 0% 25% 25%"></div>
</div>`;

export let singleDiv = `<div className="container" style="background-color: pink"></div>`