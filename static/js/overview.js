async function get_data() {
    // let data = await d3.text(`/static/data/data(${query}).txt`)
    let data = await d3.text('../static/data/data(Angelina Jolie).txt')
    //let description = await d3.text(`/static/data/brief(${query}).txt`)
    let description = await d3.text('../static/data/brief(Angelina Jolie).txt')

    let name = description.split(',')[0].replace('name:', "")
    d3.select('.brief-demo').text(description.replace(`name:${name}, introduction:`, ""))
    d3.select('.brief-title').text(name)

    //d3.select('.rect-inner img').attr('src', `/static/img/${query}.jpg`)//'./img/Evelyn Waugh.jpeg''./img/' + name + '.jpg'
    d3.select('.rect-inner img').attr('src', '../static/img/Angelina Jolie.jpg')
    let split_data = data.split('\r\n')

    let _data = split_data.map(d => {

        let date = d.split(',')[5]?.trim().replace('date:', "") ?? "" 
        //?.：在引用为null或者undefined的情况下不会引起错误，该表达式短路返回值为undefined;
        //??：左侧为null或者undefined时，才返回右侧的值
        date = Array.from(date.matchAll(/\d{4}/g))
        //string.matchAll(reg),reg必须设置为g(全局模式)，否则会报错
        return {
            content: d.match(/.*(?=dimension:)/)?.[0],
            date: date?.[0]?.[0],
            origin: d.match(/(origin)\:.*/)?.[0].replace('origin:', ""),
            dimension: d.match(/(dimension)\:.*?(?=,)/)?.[0].replace('dimension:', ""),
            type: d.match(/(type)\:.*?(?=,)/)?.[0].replace('type:', ""),
        }
        //正则表达式expression1(?=expression2)：查找expression2前面的expression1
        //正则表达式：*匹配0或多个正好在它之前的那个字符；?匹配0或1个正好在它之前的那个字符；.是任意字符 可以匹配任何单个字符
        //.* 具有贪婪的性质，首先匹配到不能匹配为止，根据后面的正则表达式，会进行回溯；
        //.*？则相反，一个匹配以后，就往下进行，所以不会进行回溯，具有最小匹配的性质
    })
    _data = _data.filter(d => d.date)
    _data.sort((a, b) => +a.date > +b.date ? -1 : 1)
    return _data
}

var data = get_data()

// 定义:树干>树枝>树杈
class Tree {
    constructor(id, svg, pos, data, degree) {
        this.id = id
        this.parent_svg = svg
        this.pos = pos
        this.data = data
        this.degree = degree
        this.init()
    }

    init() {
        this.init_svg()
        this.init_image_for_use_to_href()
        this.draw_branch()
    }

    init_svg() {
        this.g = this.parent_svg.append('g')
    }

    draw_branch() {
        this.is_up = this.id % 2 === 0
        this.data_types = d3.groups(this.data, d => d.type)

        // trunk是多个类型的情况.需要判断是否有多个类型,来画树干
        this.add_trunk_while_multi_types()
        this.add_year_text()

        this.data_types.forEach((d, i) => {
            this.if_trunk_then_add_and_rotate_trunk()
            let { pos, direction, trunk_degree } = this.get_position_direction_from_trunk(d)
            this.add_leaves({
                data: d[1],
                img_id: d[0],
                g: this.leaves_g,
                position: pos ? pos : { x: 0, y: 0 },
                direction: direction,
                trunk_degree
            })
        })
    }

    // 根据角度画 🍃部分
    add_leaves(params) {
        let { data } = params
        params.total = data.length

        this.get_rotate_value(params)
        this.append_leavesUse_and_spirePath_container(params)
        const append_use = this.get_imge_use_func(params)
        const append_spire = this.get_spire_func(params)
        const append_annotation = this.get_annotion_func(params)
        data.forEach((d, i) => {
            // 添加枝条和树叶
            this.spire_path = append_spire(d, i)
            this.spire_image_use = append_use(d, i)
            // 添加dimension的anotation框
            append_annotation(d, i)
        })
    }

    if_trunk_then_add_and_rotate_trunk() {
        this.leaves_g = this.trunk_g ? this.trunk_g : this.g.append('g').attr('class', 'onlyleaves')
        this.leaves_g.attr('transform', `rotate(${(this.is_up && this.trunk_g) ? 180 : 0})`)
        this.trunk_g && this.leaves_g.attr('transform', `rotate(${this.is_up ? 180 : this.degree})`)
    }

    get_position_direction_from_trunk(d) {
        let pos, direction, trunk_degree = 0

        if (this.trunk_path) {
            let path_length = this.trunk_path.node().getTotalLength()
            pos = this.trunk_path.node().getPointAtLength(path_length * this.types_position[d[0]])
            let pos1 = this.trunk_path.node().getPointAtLength(path_length * this.types_position[d[0]] * 0.98)
            trunk_degree = Math.atan((pos.y - pos1.y) / (pos.x - pos1.x)) / Math.PI * 180
            // 这里调整方向
            direction = this.types_direction[d[0]]
        }
        return { pos, direction, trunk_degree }
    }

    add_trunk_while_multi_types() {
        this.trunk_g = undefined
        this.trunk_path = undefined
        if (this.data_types.length > 1) {
            let return_values = this.add_trunk()
            this.trunk_g = return_values.trunk_g
            this.trunk_path = return_values.trunk_path
        }

        // 如果是树干,定义树干的四种类型的位置和方向
        this.types_position = {
            geography: 0.3, relation: 1, temporal: 0.1, career: 0.7
        }
        this.types_direction = {
            geography: "left", relation: "right", temporal: "center", career: "top"
        }
    }

    add_year_text() {
        // 加年份
        this.g.append('text')
            .attr('transform', `translate(${this.is_up ? "0,-15" : "0,15"})`) //TODO：这个位置到底是什么
            .text(this.data[0].date)
            .attr('font-size', '0.1rem')
            .attr('fill', 'gray')
    }

    add_trunk() {
        let trunk_g = this.g.append('g')
            .attr('class', 'trunk2')
        // 树干
        let trunk_path = trunk_g.append('path')
            // .attr('d', `M0,0 c 0,5 -2,5 0,8`)
            .attr('d', `M0,0  c 0,5 -2,5 0,12`)
            .attr('stroke', "#5b584a")
            .attr('fill', "none")
            .attr('stroke-width', 0.1)
        return { trunk_g, trunk_path }
    }
    //d: M = moveto(M X,Y)：将画笔移动到指定的坐标位置；C = curveto(C X1,Y1,X2,Y2,ENDX,ENDY)：三次贝赛曲线
    //stroke: 描边颜色
    //fill: 填充颜色
    //stroke-width: 描边宽度

    append_leavesUse_and_spirePath_container(params) {
        let { g, position, direction } = params
        this.leaves_of_types_g = g.append('g').attr('class', 'leaves_1')
            .attr('transform', `translate(${position.x},${position.y}) 
                  rotate(${this.is_up ? 180 : 0}) ${(direction === "left") ? "matrix(-1 0 0 1 0 0)" : ""}`)
    }
    //transform: translate(x,y) 以页面左上角为基准，元素左上角位于(x,y)，右下为正
    //transform: rotate(x) 以元素中心为轴，顺时针旋转x°
    //transform: matrix(x1,x2,x3,x4,x5,x6) 相当于 矩阵(x1,x3,x5;x2,x4,x6;0,0,1)和(x;y;1)相乘
    //transform: matrix(-1 0 0 1 0 0)相当于把（x,y）变换为（-x，y）

    get_spire_func(params) {
        let { img_id, data, g, position, direction, trunk_degree } = params
        return (d, i) => {
            let adjuest_degree = ((i % 2 === 0 ? 1 : -1) * i * 30)
            let spire_degree = 90 - this.degree - adjuest_degree

            let x = Math.abs(Math.sin(spire_degree) * 5)
            let y = (trunk_degree ? (this.is_up ? -1 : 1) : 1) * Math.abs(Math.cos(spire_degree) * 5)
            y = Math.abs(y) < 1.5 ? 4 : y
            // x = Math.abs(x) >4 ? 2 : x
            return this.leaves_of_types_g.append('path')
                .attr('d', `M 0,0 q ${x / 4},${y / 4} ${x * 0.4},${y * 1.2}`)
                .attr('stroke', 'url(#Gradient1)')
                .attr('stroke-width', 0.4)
                .attr('fill', 'none')
                .attr('opacity', 1)
        }
    }
    //d: Q = quadratic Belzier curve(Q X,Y,ENDX,ENDY)：二次贝赛曲线
    //g元素可以把多个元素组织在一起的元素

    get_imge_use_func(params) {
        let { img_id, trunk_degree } = params
        return (d, i) => {

            let total = this.spire_path.node().getTotalLength()
            let pos = this.spire_path.node().getPointAtLength(total)
            let uses = this.leaves_of_types_g.append('g')
                .attr('transform', `translate(${pos.x - 2}, ${pos.y - 2}) scale(1)`)
                .append('use')
                .attr('xlink:href', `#${img_id}`)
                .attr('class', 'myimg')
            uses.on('mouseover', (e) => {
                this.tips_show(e, d)
            })
            uses.on('mouseleave', () => {
                this.tips_hide()
            })
            return uses
        }
    }

    get_annotion_func(params) {
        let { img_id, data, g, position, direction, trunk_degree } = params

        return (d, i) => {
            if (d.dimension !== "Highlight") return
            let pos = this.spire_path.node().getPointAtLength(this.spire_path.node().getTotalLength())

            let classname = d.content.slice(-15).replace(/\W/g, '')

            let path = this.leaves_of_types_g.append('path')
                .attr('d', `M ${pos.x},${pos.y} q 2,0  
                 ${Math.abs(Math.sin(90 - this.degree + (i * 90)) * 105)},  
                ${(trunk_degree ? (this.is_up ? -1 : 1) : 1) *
                    Math.abs(Math.cos(90 - this.degree + (i * 90)) * 55)} `)
                // .attr('stroke', 'url(#Gradient1)')
                // .attr('stroke', 'gray')
                // .attr('stroke-width', 0.1)
                .attr('stroke-dasharray', '1 1')
                .attr('fill', 'none')
                .attr('opacity', 1)
                .attr('class', `annotion_path annotion_path${classname}`)
                .attr('title', d.date + '/' + d.content + '/'
                    + d.type + '/' + d.origin +
                    '/' + `annotion_path${classname}` + '/' + d.dimension)
        }
    }

    init_image_for_use_to_href() {
        let defs = this.g.append('defs')
        let w = 4
        let h = 4
        this.image_w = w
        this.image_h = h
        this.scale = 1
        defs.append('image').attr('href', '/static/img/branch.svg').attr('id', "img_branch")

        let draw_image = (path, id) => {
            defs.append('image')
                .attr('href', path)
                .attr('id', id)
                .attr('width', w)
                .attr('height', h)
        }

        draw_image('/static/img/upper-right-legend/geographic event-open.svg', 'geography')
        draw_image('/static/img/upper-right-legend/relationship event-open.svg', 'relation')
        draw_image('/static/img/upper-right-legend/temporal event-open.svg', 'temporal')
        draw_image('/static/img/upper-right-legend/career event-open.svg', 'career')
    }

    tips_show(e, d, img_g) {
        let types = {
            geography: "pink", relation: "yellow", temporal: "gray", career: "green"
        }

        d3.select(".d3-tip")
            .style("display", "block")
            .style("position", "absolute")
            .style("top", `${e.pageY + 10}px`)
            .style("left", `${e.pageX + 10}px`)
            .html(
                () => ` <div>
                <div>
                    <img src="/static/img/tooltip_${types[d.type]}.svg" class="tooltip-icon" style="vertical-align:middle">
                </div>
                <div class="tooltip-paragraph">
                    <div class="tooltip-title">${d?.date}, ${d?.type} Event</div>
                    <div  class="tooltip-text">
                    ${d?.origin}
                    </div>
                </div>
            </div>
            `
            );
        // d3.select('use').attr('opacity', 1)
        // img_g.selectAll('use').attr('class', "i")
    }

    tips_hide() {
        d3.select(".d3-tip").style("display", "none");
    }

    get_rotate_value(params) {
        let { direction, trunk_degree, total } = params
        // 定义旋转角度的函数
        let rotate_branch = (d, i) => {
            return direction === "top" ?
                trunk_degree + 60 / total * i :
                direction === "left" ?
                    90 + trunk_degree + 90 / total
                    : direction === "right" ?
                        -trunk_degree + 90 / total : trunk_degree + 90 / total
        }
        // 定义添加树叶图片的函数
        this.rotate_value = (d, i) => trunk_degree ? rotate_branch(d, i) : this.degree + 90 / total * i
    }

}

class LifeCircle {
    constructor() {
        this.init()
    }
    async init() {
        this.init_tip()
        this.data = await get_data()
        // 画生命曲线-4个圆弧

        // 获得4个阶段的位置.
        // 循环画树枝.给树枝数据
        let max_age = d3.max(this.data, d => +d.date)
        let min_age = d3.min(this.data, d => +d.date)
        let types = d3.group(this.data, d => d.type)
        let groups_by_year = d3.groups(this.data, d => d.date) //得到嵌套的数组
        groups_by_year.forEach((d, i) => {
            let percents = (+d[0] - min_age) / (max_age - min_age)
            d.percents = percents <= 0.25 ? "1" : percents <= 0.5 ? "2" : percents <= 0.75 ? "3" : "4"
        })

        this.year_4group = d3.rollups(groups_by_year, d => d.length, d => d.percents)
        this.init_circle()

        // 循环年份画树枝
        groups_by_year.forEach((d, i) => {
            // 获取最大年份
            let percents = (+d[0] - min_age) / (max_age - min_age)
            //获取当前年份
            // 获取百分比
            let id = i
            this.draw_branch(percents, id, d[1])
        })

        this.add_event()
        this.add_annotion()
    }

    init_tip() {
        d3.select("body")
            .append("div")
            .attr("class", "d3-tip")
            .style("display", "none")
    }

    init_circle() {
        let div = d3.select('#life')
        this.w = window.innerWidth * 0.9
        this.h = window.innerHeight * 0.9
        let svg = div.append('svg').lower()
            .attr('width', this.w)
            .attr('height', this.h)
            .attr('transform', 'rotate(15)')

        // 渐变色定义
        this.append_gradient_color_of_life_circlce_line(svg)
        let path = svg.append('path')

        this.year_4group.sort((a, b) => +a[0] > +b[0] ? 1 : -1)
        let total = d3.sum(this.year_4group, d => d[1])

        let radius = this.w * 0.8
        path.attr('d',
            `M ${this.w * 0.15}, ${this.h * 0.5}
                q ${radius * this.year_4group?.[0]?.[1] / total / 2}, ${this.h * 0.2} ${radius * this.year_4group[0][1] / total}, 0
                t ${radius * this.year_4group?.[1]?.[1] / total}, 0
                t  ${radius * this.year_4group?.[2]?.[1] / total}, 0
                t  ${radius * this.year_4group?.[3]?.[1] / total}, 0
            `)
            .attr('fill', 'none')
            .attr('stroke', 'url(#Gradient2)')
            .attr('stroke-linejoin', 'round')
            .attr('stroke-width', 2)
            .attr('opacity', 0.4)

        this.path = path
        this.add_stage(svg, radius, total)
        this.svg = svg
    }
    //d: T = smooth quadratic Belzier curveto(T ENDX,ENDY)：映射

    add_stage(svg, radius, total) {

        let path_length = this.path.node().getTotalLength()
        let images = [0, 1, 2, 3, 4]
        let x = this.w * 0.15
        let max_age=d3.max(this.data, d =>+d.date)
        let min_age=d3.min(this.data, d =>+d.date)
        let stages=[1991,1998,2001,2005,2011]
        let stage_texts=[
            'Early work(1991-1997)',
            'Breakthrough(1998-2000)',
            'Worldwide recognition(2001-2004)',
            'Established actress(2005-2010)',
            'Career Expansion(2011-present)'
        ]
        images.forEach(d => {

            // 计算实际位置,按照年份计算百分比
            let percent = (stages[d] - min_age) / (max_age - min_age)
            x = radius * percent + x
            // 角度计算
            let pos = this.path.node().getPointAtLength(path_length * percent)
            let pos1 = this.path.node().getPointAtLength(path_length * percent * 0.9)
            let degree = Math.atan((pos.y - pos1.y) / (pos.x - pos1.x)) / Math.PI * 180

            // 添加图片
            let stage = svg.append('g')
                .attr('transform', `translate(${pos.x - 25},${pos.y - 25}) rotate(${degree-35} ${25} ${25} )`)
            let img_stage = stage.append('image')
                .attr('href', '/static/img/stage.svg')
                .attr('width', 40)
                .attr('height', 40)

       /* images.forEach(d => {
            x = radius * this.year_4group?.[d]?.[1] / total + x

            let pos = this.path.node().getPointAtLength(path_length * (d + 1) * 0.25)
            let pos1 = this.path.node().getPointAtLength(path_length * (d + 1) * 0.25 * 0.95)

            let degree = Math.atan((pos.y - pos1.y) / (pos.x - pos1.x)) / Math.PI * 180
            let stage = svg.append('g')
                .attr('transform', `translate(${x - 25},${this.h * 0.5 - 25})  
                rotate(${(90 + (degree))}  25 25)`)
            stage.append('image')
                .attr('href', './img/stage.svg')
                .attr('width', 40)
                .attr('height', 40)
        })*/
        // 添加事件
        img_stage.on('mouseover', (e) => {
            d3.select(".d3-tip")
                .style("display", "block")
                .style("position", "absolute")
                .style("top", `${e.pageY + 10}px`)  //TODO：绝对还是相对,.html是怎么用的
                .style("left", `${e.pageX + 10}px`)
                .html(
                    () => ` <div>   ${stage_texts[d]}  </div> `
                );
        })
            .on('mouseleave', () => {
                d3.select(".d3-tip").style("display", "none");

            })
        })
        
}
    draw_branch(percents, id, data) {
        let path_length = this.path.node().getTotalLength()
        let pos = this.path.node().getPointAtLength(path_length * percents)
        let pos1 = this.path.node().getPointAtLength(path_length * percents * 0.9)
        let degree = Math.atan((pos.y - pos1.y) / (pos.x - pos1.x))

        let g = this.svg.append('g').attr('transform', `translate(${pos.x} , ${pos.y})  scale(6)`)
        // transform: scale(n)  X、Y分别放大n倍,原来的元素在放大后的元素的中心
        new Tree(id, g, pos, data, degree / Math.PI * 180)
    }

    add_event() {
        let legends = d3.selectAll('.legend')
        legends.on('click', (e, d) => {
            let name = d3.select(e.target).attr('href')
            let last_name = name.slice(name.length - 8)
            let id = d3.select(e.target).attr('id')
            console.log(id);
            if (last_name === "open.svg") {
                d3.select(e.target).attr('href', name.replace("open.svg", 'closed.svg'))
                d3.selectAll(`#${id}`).attr('href', name.replace("open.svg", 'closed.svg'))

            } else {
                d3.select(e.target).attr('href', name.replace("closed.svg", 'open.svg'))
                d3.selectAll(`#${id}`).attr('href', name.replace("closed.svg", 'open.svg'))
            }
        })
    }

    append_gradient_color_of_life_circlce_line(svg) {
        let defs = svg.append('defs')
        let linearGRadient1 = defs.append('linearGradient').attr('id', 'Gradient1')
        linearGRadient1.append('stop').attr('stop-color', '#5b584a').attr('offset', '20%')
        linearGRadient1.append('stop').attr('stop-color', '#5b584a').attr('offset', '100%').attr('stop-opacity', 0.1)

        let linearGRadient2 = defs.append('linearGradient').attr('id', 'Gradient2')
        linearGRadient2.append('stop').attr('stop-color', '#5b584a').attr('offset', '0%').attr('stop-opacity', 0.1)
        linearGRadient2.append('stop').attr('stop-color', '#5b584a').attr('offset', '15%')
        linearGRadient2.append('stop').attr('stop-color', '#5b584a').attr('offset', '85%')
        linearGRadient2.append('stop').attr('stop-color', '#5b584a').attr('offset', '100%').attr('stop-opacity', 0.1)
    }

    add_annotion() {
        let annotions = d3.selectAll('.annotion_path')
        annotions._groups.map(d => {
            d.forEach((v, i) => {

                let value = d3.select(v).attr('title').split('/')
                if (value[5] !== "Highlight") return
                let length = v.getTotalLength()
                let pos = v.getPointAtLength(length)

                let pos_parent = v.parentNode.parentNode.parentNode.parentNode.getBoundingClientRect()

                let div = d3.select('body').append('div').attr('class', 'annotion_container')
                    .style('position', 'absolute')
                    .style('left', (pos.x + pos_parent.x + "px"))
                    .style('top', (pos.y + pos_parent.y + (i % 2 === 0 ? -pos_parent.height / 2 : pos_parent.height / 2)) + "px")

                let icons = div.append('img')
                    .style('font-size', 2)
                    .attr('class', 'annotation-icon')
                    .attr('src', `/static/img/${value[2]}.svg`)

                div.append('p')
                    .style('font-size', 2)
                    .attr('class', 'annotation-title')
                    .html(value[0] +' '+ value[2]+' '+'event')

                div.append('p')
                    .style('font-size', 2)
                    .attr('class', 'annotation-text')
                    .html(value[3])

                const drag = (e, d) => {
                    div.style('left', (e.x + "px"))
                        .style('top', (e.y) + "px")
                    // 移动path
                    let d_path = d3.select(`.${value[4]}`).attr('d').replace('q', 'L')
                    d3.select(`.${value[4]}`).attr('d', d_path.split('L')[0] + ` L ${e.dx},${e.dy}`)
                }

                div.call(d3.drag().on("drag", drag));
            })
        })
    }
}

new LifeCircle()

