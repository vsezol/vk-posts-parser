const puppeteer = require('puppeteer')
const fs = require('fs')
const path = require('path')
const cheerio = require('cheerio')
const chalk = require('chalk')
const readline = require('readline')

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
})

const authorName = [
	' _                                           _',
	'| |__   _  _    __ __  ___  ___   ___  ___  | |',
	"| '_ \\ | || |   \\ V / (_-< / -_) |_ / / _ \\ | |",
	'|_.__/  \\_, |    \\_/  /__/ \\___| /__| \\___/ |_|',
	'        |__/\n'
]

const autoScroll = async page => {
	await page.evaluate(async () => {
		await new Promise(resolve => {
			let totalHeight = 0
			let distance = 100
			let timer = setInterval(() => {
				let scrollHeight = document.body.scrollHeight
				window.scrollBy(0, distance)
				totalHeight += distance
				if (totalHeight >= scrollHeight) {
					clearInterval(timer)
					resolve()
				}
			}, 100)
		})
	})
}

const clickAllReadMore = async page => {
	await page.evaluate(async () => {
		await (async () => {
			const readMoreArr = document.querySelectorAll('.wall_post_more')
			readMoreArr.forEach(item => {
				item.click()
			})
		})
	})
}

const getContent = async url => {
	console.log(chalk.red('    Запускаем браузер...'))
	const browser = await puppeteer.launch()
	console.log(chalk.red('    Открываем новую вкладку...'))
	const page = await browser.newPage()
	console.log(chalk.red('    Переходим по ссылке...'))
	await page.goto(url)
	console.log(chalk.red('    Скролим страницу до конца...'))
	await autoScroll(page)
	console.log(chalk.red('    Копируем контент...'))
	const content = await page.content()
	console.log(chalk.red('    Закрываем браузер...'))
	await browser.close()
	return content
}

const writeFile = async (path, content) => {
	await new Promise((res, rej) => {
		fs.writeFile(path, content, err => {
			if (err) throw rej()
			res()
		})
	})
}

const getUrl = async () =>
	await new Promise(res => {
		rl.question('Set the url: ', url => {
			res(url)
			rl.close()
		})
	})

const main = async () => {
	console.log(chalk.green(authorName.join('\n')))
	const url = await getUrl()
	console.log(chalk.green('Стадия 1. Загрузка.'))
	const content = await getContent(url)
	console.log(chalk.cyan('Стадия 2. Парсинг.'))
	const $ = cheerio.load(content)
	const allPosts = []
	console.log(chalk.yellow('    Обрабатываем посты...'))
	$('.wall_post_text').each(async function () {
		const post = $(this).text()
		post.replace(/Показать полностью…/g, ' ')
		allPosts.push(post)
	})
	console.log(chalk.yellow('    Записываем данные в файл...'))
	await writeFile(path.join(__dirname, 'output.txt'), allPosts.join('\n#\n'))
	console.log(chalk.green('Конец. Данные лежат в output.txt'))
}

main()