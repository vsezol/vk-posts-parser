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
	'        |__/\n',
]

const autoScroll = async page =>
	await page.evaluate(
		async () =>
			await new Promise(res => {
				let totalHeight = 0
				const distance = 100
				const timer = setInterval(() => {
					const scrollHeight = document.body.scrollHeight
					window.scrollBy(0, distance)
					totalHeight += distance
					if (totalHeight >= scrollHeight) {
						clearInterval(timer)
						res()
					}
				}, 100)
			})
	)

const getContent = async url => {
	console.log(chalk.red('    Launch the browser ...'))
	const browser = await puppeteer.launch()

	console.log(chalk.red('    Open a new tab ...'))
	const page = await browser.newPage()

	console.log(chalk.red(`    Follow the ${url} ...`))
	await page.goto(url)

	console.log(chalk.red('    Scroll the page to the end ...'))
	await autoScroll(page)

	console.log(chalk.red('    Copy content ...'))
	const content = await page.content()

	console.log(chalk.red('    Close the browser ...'))
	await browser.close()

	return content
}

const writeFile = async (path, content) =>
	await new Promise((res, rej) => {
		fs.writeFile(path, content, err => {
			if (err) throw rej()
			res()
		})
	})

const askUrl = async () =>
	await new Promise(res => {
		rl.question('Set the url: ', url => {
			res(url)
		})
	})

const askFileName = async () =>
	await new Promise(res => {
		rl.question('Set the file name: ', url => {
			res(url)
			rl.close()
		})
	})

const main = async () => {
	console.log(chalk.green(authorName.join('\n')))

	const url = await askUrl()
	const fileName = await askFileName()

	console.log(chalk.green('Stage 1. Download.'))
	const content = await getContent(url)

	console.log(chalk.cyan('Stage 2. Parsing.'))

	console.log(chalk.yellow('    Load HTML ...'))
	const $ = cheerio.load(content)
	const allPosts = []

	console.log(chalk.yellow('    Processing posts ...'))
	$('.wall_post_text').each(async function () {
		const post = $(this).text().replace(/Показать полностью…/g, ' ')
		allPosts.push(post)
	})

	console.log(chalk.yellow(`    We write the data to a ${fileName} ...`))
	await writeFile(path.join(__dirname, fileName), allPosts.join('\n#\n'))

	console.log(chalk.green('Stage 3. End. DATA =>', fileName))
}
main()
