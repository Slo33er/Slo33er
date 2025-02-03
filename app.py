from flask import Flask, render_template, request, flash, redirect, url_for

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'  # Replace with a secure secret key

def calculate_pallets(total_boxes, boxes_per_layer, layers_per_pallet):
    """
    Calculates:
      - total boxes,
      - full pallets,
      - leftover boxes,
      - full layers on the last (partial) pallet, and 
      - boxes on the final layer.
    """
    boxes_per_pallet_total = boxes_per_layer * layers_per_pallet

    full_pallets = total_boxes // boxes_per_pallet_total
    leftover_boxes = total_boxes % boxes_per_pallet_total

    full_layers_on_partial_pallet = leftover_boxes // boxes_per_layer
    boxes_on_final_layer = leftover_boxes % boxes_per_layer

    return {
        "total_boxes": total_boxes,
        "full_pallets": full_pallets,
        "leftover_boxes": leftover_boxes,
        "full_layers": full_layers_on_partial_pallet,
        "final_layer": boxes_on_final_layer,
    }

@app.route("/", methods=["GET", "POST"])
def pallet_calculator():
    if request.method == "POST":
        try:
            total_boxes = int(request.form["total_boxes"])
            boxes_per_layer = int(request.form["boxes_per_layer"])
            layers_per_pallet = int(request.form["layers_per_pallet"])

            if total_boxes <= 0 or boxes_per_layer <= 0 or layers_per_pallet <= 0:
                flash("All input values must be positive numbers.", "danger")
                return redirect(url_for("pallet_calculator"))

            result = calculate_pallets(total_boxes, boxes_per_layer, layers_per_pallet)
            return render_template("index.html", result=result)

        except ValueError:
            flash("Please enter valid integer values.", "danger")
            return redirect(url_for("pallet_calculator"))

    return render_template("index.html")

if __name__ == "__main__":
    app.run(debug=True)